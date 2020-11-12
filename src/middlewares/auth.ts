import { hasPermission, isRole } from '@/helpers/auth';
import { AppError } from '@/helpers/base/error';
import { RequestHandler } from '@/helpers/base/express';
import roleModel from '@/services/auth/models/role.model';
import { User } from '@/services/auth/models/user.model';

const MdAuth = (roles: string[], permissions?: string[]): RequestHandler => {
	return async (req, res, next) => {
		if (!req.state?.user) {
			return next(new AppError({ code: 401, message: 'Không có thông tin đăng nhập!' }));
		}

		const user: User = req.state.user;
		const adminRole = await roleModel.model.findOne({ isAdmin: true });
		const adminRoleToken = adminRole.token;
		if (
			(adminRoleToken && isRole(user, 'super_admin')) ||
			roles.some((role) => isRole(user, role))
		) {
			return next();
		}

		if (permissions) {
			if (permissions.some((p) => hasPermission(user, p))) {
				return next();
			}
		}

		next(
			new AppError({
				code: 401,
				message: 'Bạn không có quyền truy cập tài nguyên này!',
			}),
		);
	};
};

export default MdAuth;
