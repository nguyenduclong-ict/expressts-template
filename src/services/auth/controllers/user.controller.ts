import { Controller } from '@/helpers/base/router';
import userModel from '../models/user.model';

export default new Controller({}, userModel).getConfig();
