import { RevenueService } from '../service/revenue.service.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

export class RevenueController {
  constructor() {
    this.revenueService = new RevenueService();
  }

  getRevenue = async (req, res, next) => {
    try {
      const data = await this.revenueService.getBusinessRevenue(req.user, req.query);
      return ApiResponse.success(res, 'Revenue data retrieved', data);
    } catch (error) {
      next(error);
    }
  };
}
