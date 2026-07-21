import { AuthService } from '../service/auth.service.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { getCookieOptions } from '../../../utils/TokenUtils.js';

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const reqInfo = {
        ip: req.ip || req.connection.remoteAddress,
        userAgentHeader: req.headers['user-agent'] || '',
      };

      const { user, accessToken, refreshToken } = await this.authService.login(email, password, reqInfo);

      res.cookie('refreshToken', refreshToken, getCookieOptions());
      res.cookie('accessToken', accessToken, { ...getCookieOptions(), maxAge: 15 * 60 * 1000 });

      return ApiResponse.success(res, 'Login successful', { user, accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req, res, next) => {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(token);

      res.cookie('refreshToken', newRefreshToken, getCookieOptions());
      res.cookie('accessToken', accessToken, { ...getCookieOptions(), maxAge: 15 * 60 * 1000 });

      return ApiResponse.success(res, 'Token refreshed successfully', { accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      await this.authService.logout(req.user._id, refreshToken);

      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');

      return ApiResponse.success(res, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req, res, next) => {
    try {
      await this.authService.logoutAll(req.user._id);

      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');

      return ApiResponse.success(res, 'Logged out from all devices successfully');
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req, res, next) => {
    try {
      const profile = await this.authService.getProfile(req.user._id);
      return ApiResponse.success(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req, res, next) => {
    try {
      const updated = await this.authService.updateProfile(req.user._id, req.body);
      return ApiResponse.success(res, 'Profile updated successfully', updated);
    } catch (error) {
      next(error);
    }
  };

  getSessions = async (req, res, next) => {
    try {
      const sessions = await this.authService.getActiveSessions(req.user._id);
      return ApiResponse.success(res, 'Active sessions retrieved', sessions);
    } catch (error) {
      next(error);
    }
  };
}
