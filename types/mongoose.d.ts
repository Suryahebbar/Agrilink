import { Document, Model, Query, Schema } from 'mongoose';

declare module 'mongoose' {
  interface Query<ResultType, DocType, THelpers = {}, RawDocType = DocType, QueryOp = 'find'> {
    op?: string;
    _update?: any;
    _conditions?: any;
    getFilter(): any;
    getUpdate(): any;
    getOptions(): any;
    model: Model<any>;
  }

  interface Document {
    isNew?: boolean;
    isModified(path?: string | string[]): boolean;
    modifiedPaths(): string[];
    get(path: string, type?: any, options?: any): any;
    set(path: string, val: any, type?: any, options?: any): this;
  }

  interface Model<T extends Document, TQueryHelpers = {}, TMethods = {}> {
    trackChanges?: boolean;
    resourceType?: string;
    getResourceName?(doc: T): string;
  }
}

export {};
