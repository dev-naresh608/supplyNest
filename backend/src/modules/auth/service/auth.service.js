import { AuthRepository } from '../repository/auth.repository.js';
import { ApiError } from '../../../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../utils/TokenUtils.js';
import { SYSTEM_USER_TYPES, ACCOUNT_STATUS } from '../../../constants/userRoles.js';
import useragent from 'useragent';

export class AuthService {
  constructor() {
    this.authRepo = new AuthRepository();
  }

  async login(email, password, reqInfo) {
    const agent = useragent.parse(reqInfo.userAgentHeader);
    const deviceName = agent.device.toString() !== 'Other 0.0.0' ? agent.device.toString() : 'Desktop';
    const browser = `${agent.toAgent()} on ${agent.os.toString()}`;
    const ipAddress = reqInfo.ip;

    const user = await this.authRepo.findByEmail(email, true);

    if (!user) {
      await this.authRepo.logLoginAttempt({
        email,
        isSuccess: false,
        failureReason: 'User not found',
        ipAddress,
        browser: agent.toAgent(),
        os: agent.os.toString(),
        userAgent: reqInfo.userAgentHeader,
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check account status
    if (user.status === ACCOUNT_STATUS.BLOCKED || user.status === ACCOUNT_STATUS.SUSPENDED) {
      throw ApiError.forbidden(`Your account is ${user.status.toLowerCase()}. Please contact administrator.`);
    }

    // Check temporary account lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw ApiError.forbidden(`Account locked due to consecutive failed logins. Try again in ${minutesLeft} minutes.`);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await user.save();

      await this.authRepo.logLoginAttempt({
        userId: user._id,
        email,
        isSuccess: false,
        failureReason: 'Invalid password',
        ipAddress,
        browser: agent.toAgent(),
        os: agent.os.toString(),
        userAgent: reqInfo.userAgentHeader,
      });

      throw ApiError.unauthorized('Invalid email or password');
    }

    // Reset failed login attempts on success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWTs
    const payload = {
      id: user._id,
      email: user.email,
      userType: user.userType,
      ancestorPath: user.ancestorPath,
      hierarchyLevel: user.hierarchyLevel,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save session
    await this.authRepo.createSession({
      userId: user._id,
      refreshToken,
      deviceName,
      browser,
      os: agent.os.toString(),
      ipAddress,
    });

    await this.authRepo.logLoginAttempt({
      userId: user._id,
      email,
      isSuccess: true,
      ipAddress,
      browser: agent.toAgent(),
      os: agent.os.toString(),
      userAgent: reqInfo.userAgentHeader,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, accessToken, refreshToken };
  }

  async refreshToken(token) {
    if (!token) throw ApiError.unauthorized('Refresh token is required');

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const session = await this.authRepo.findSessionByToken(token);
    if (!session) throw ApiError.unauthorized('Session has been revoked or expired');

    const user = await this.authRepo.findById(decoded.id);
    if (!user || user.status !== ACCOUNT_STATUS.ACTIVE) {
      throw ApiError.unauthorized('User is inactive or deleted');
    }

    const payload = {
      id: user._id,
      email: user.email,
      userType: user.userType,
      ancestorPath: user.ancestorPath,
      hierarchyLevel: user.hierarchyLevel,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    session.refreshToken = newRefreshToken;
    session.lastActive = new Date();
    await session.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId, refreshToken) {
    if (refreshToken) {
      const session = await this.authRepo.findSessionByToken(refreshToken);
      if (session) {
        session.isRevoked = true;
        await session.save();
      }
    }
  }

  async logoutAll(userId) {
    await this.authRepo.revokeAllUserSessions(userId);
  }

  async getProfile(userId) {
    const user = await this.authRepo.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async updateProfile(userId, updateData) {
    const allowed = ['firstName', 'lastName', 'phone', 'address', 'city', 'state', 'country', 'pincode', 'timezone', 'language'];
    const filtered = {};
    Object.keys(updateData).forEach((key) => {
      if (allowed.includes(key)) filtered[key] = updateData[key];
    });

    const updatedUser = await this.authRepo.updateUser(userId, filtered);
    return updatedUser;
  }

  async getActiveSessions(userId) {
    return await this.authRepo.getUserSessions(userId);
  }
}
