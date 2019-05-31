export = index;
declare class index {
    constructor(uri: any, opts: any);
    uri: any;
    opts: any;
    afterRetrieveTransformID(entity: any, idField: any): any;
    beforeSaveTransformID(entity: any, idField: any): any;
    clear(): any;
    connect(): any;
    count(filters: any): any;
    createCursor(params: any, isCounting: any): any;
    disconnect(): any;
    entityToObject(entity: any): any;
    find(filters: any): any;
    findById(_id: any): any;
    findByIds(idList: any): any;
    findOne(query: any): any;
    init(broker: any, service: any): void;
    insert(entity: any): any;
    insertMany(entities: any): any;
    objectIDToString(id: any): any;
    removeById(_id: any): any;
    removeMany(query: any): any;
    stringToObjectID(id: any): any;
    transformSort(paramSort: any): any;
    updateById(_id: any, update: any): any;
    updateMany(query: any, update: any): any;
}
