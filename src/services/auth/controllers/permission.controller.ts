import { Controller } from '@/helpers/base/router';
import permissionModel from '../models/permission.model';

export default new Controller({}, permissionModel).getConfig();
