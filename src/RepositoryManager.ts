import { CosmosClient, Database, Container } from '@azure/cosmos';

type ConnectionConfig = {
    ConnectionString: string
    database: string
    containers?: string[]
}

class Manager {
    private client: CosmosClient
    private database: Database
    private containers: Container[]

    public configure(config: ConnectionConfig) {
        this.client = new CosmosClient(config.ConnectionString)
        this.database = this.client.database(config.database)
    }

    public getClient () {
        return this.client
    }

    public getDatabase () {
        return this.database
    }

    public getContainer (id: string) {
        let container = this.containers[id] ?? undefined
        if (undefined === container) {
            container = this.database.container(id)
            this.containers[id] = container
        }
        return container
    }
}

const RepositoryManager = new Manager()

export default RepositoryManager