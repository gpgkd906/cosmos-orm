import { Resource } from '@azure/cosmos';
import { RepositoryInterface } from "./Repository"
import { CreateDocument } from "./utils"

interface TrackableDocument {
    id?: string,
    create_datetime?: string
    update_datetime?: string
}

export interface EntityInterface<T extends EntityInterface<T>> extends TrackableDocument {
    create_datetime?: string
    update_datetime?: string
    createAt: Date | void
    updateAt: Date | void
    readonly partitionKey: string
    partition: string
    raw: Resource,
    presist(): void,
    from(data: unknown): void,
    export(): TrackableDocument,
}

// Abstract Entity & Abstract Repository
export abstract class AbstractEntity<T extends EntityInterface<T>> implements EntityInterface<T> {
    protected _id!: string | undefined;
    public create_datetime?: string
    public update_datetime?: string
    private __doc__?: Resource
    private __meta__: {
        propertyNames: string[]
    };
    readonly partitionKey: string
    private static excludeProps = ['id', '_id', '__doc__', '__meta__', 'partitionKey']

    abstract getRepository(): RepositoryInterface<T>

    get id() {
        return this._id
    }

    public async presist() {
        if (this.id) {
            this.getRepository().update(this, this.export())
        } else {
            const item = await CreateDocument(this.export(), this.getRepository().getContainer())
            this.from(item);
        }
    }

    private getMetaInfo() {
        if (!this.__meta__) {
            const propertyNames = Object.getOwnPropertyNames(this)
            this.__meta__ = {
                propertyNames: propertyNames.filter(prop => !AbstractEntity.excludeProps.includes(prop))
            }
        }
        return this.__meta__;
    }

    public from(data: unknown) {
        const exclude = ['id', '_id', '__doc__', '__meta__', 'partitionKey'];
        const keys = Object.keys(data).filter(key => !AbstractEntity.excludeProps.includes(key))
        for(const prop of keys) {
            this[prop] = data[prop] ?? this[prop] ?? undefined
        }
        this._id     = (data as any).id ?? this._id
        this.__doc__ = data as Resource;
        this.update_timestamp()
    }

    public export() {
        const propertyNames = this.getMetaInfo().propertyNames;
        const object: unknown = { id: this._id }
        for(const prop of propertyNames) {
            object[prop] = this[prop]
        }
        return object as Partial<T>;
    }

    public update_timestamp() {
        let datetime = new Date();
        if (!this.create_datetime) {
            this.create_datetime = datetime.toISOString()
        }
        this.update_datetime = datetime.toISOString()
    }

    get createAt() {
        if (this.create_datetime) {
            return new Date(this.create_datetime)
        }
        return
    }

    get updateAt() {
        if (this.update_datetime) {
            return new Date(this.create_datetime)
        }
        return
    }

    get partition() {
        return this[this.partitionKey];
    }

    get raw() {
        return this.__doc__;
    }
}
