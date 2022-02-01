import { CosmosClient, Database, Container } from '@azure/cosmos';
import { EntityInterface } from "./Entity"
import { queryContainer, CreateDocument, sleep } from "./utils"
import RepositoryManager from "./RepositoryManager"

export interface RepositoryInterface<T extends EntityInterface<T>> {
    getRepositoryManager(): typeof RepositoryManager
    getContainer(): Container
    query(Query: string, parameters?: unknown[]): Promise<T[]>
    find(id): Promise<T>
    create(data: unknown): Promise<T>
    update(entity: EntityInterface<T>, data:unknown): Promise<T>
    remove(entity: EntityInterface<T>): Promise<void>
    newEntity(data?: unknown): T
}

export abstract class AbstractRepository<T extends EntityInterface<T>> implements RepositoryInterface<T>
{
    protected __container__: string
    private repositoryManager = RepositoryManager

    public getRepositoryManager () {
        return RepositoryManager
    }

    public getContainer():Container
    {
        return this.repositoryManager.getContainer(this.__container__);
    }

    abstract newEntity(data?: unknown): T

    public async query(query: string, parameters?: unknown[]) 
    {
        const items = await queryContainer(this.getContainer(), query, parameters)
        return items.map(item => this.newEntity(item))
    }

    public async all() {
        return await this.query('SELECT * from c')
    }

    public async top(number: number) {
        return await this.query('SELECT TOP ? * from c', [number])
    }

    public async topOne() {
        const result = await this.top(1)
        return result[0] ?? null;
    }

    public async last(number: number) {
        return await this.query('SELECT TOP ? * from c ORDER BY c._ts DESC', [number])
    }

    public async lastOne() {
        const result = await this.last(1)
        return result[0] ?? null;
    }

    public async find(id) {
        const item = await this.getContainer().item(id);
        return this.newEntity(item);
    }

    public async create(data: Partial<T>) {
        const entity = this.newEntity(data)
        const item = await CreateDocument(entity.export(), this.getContainer())
        entity.from(item)
        return entity
    }

    public async update(entity: T, data: Partial<T>) {
        entity.from(data)
        await this.getContainer().item(entity.id, entity.partition).replace(entity.export())
        return entity
    }

    public async remove(entity: T) {
        await this.getContainer().item(entity.id, entity.partition).delete()
        entity.from({})
    }

    public async removeAll(delay = 100) {
        const items = await this.all()
        for(const item of items) {
            console.log(item)
            await this.remove(item)
            await sleep(delay)
        }
    }
}