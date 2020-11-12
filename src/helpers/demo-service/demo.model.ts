import { BaseModel, Owner, Timestamp } from '@/helpers/base/model';
import { Document, Schema } from 'mongoose';

export interface Demo extends Document, Timestamp, Owner<any> {}

const DemoSchema = new Schema<Demo>({
	...Timestamp,
	...Owner,
});

export class DemoModel extends BaseModel<Demo> {}

export default new DemoModel('Demo', DemoSchema);
