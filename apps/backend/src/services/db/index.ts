import { Injectable } from '@nestjs/common';
import * as operators from 'drizzle-orm';
import * as schema from './schema';
import db from './client';
import { getTableColumns } from 'drizzle-orm';
import { getObjectKeys } from 'src/utils/object';

@Injectable()
export class DbService {
  readonly db = db;
  readonly schema = schema;
  readonly operators = operators;
  readonly columns = {
    Users: getObjectKeys(getTableColumns(this.schema.Users)),
    Exams: getObjectKeys(getTableColumns(this.schema.Exams))
  };
}
