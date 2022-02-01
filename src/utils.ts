import { Container, Resource, FeedResponse } from '@azure/cosmos';

export function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
}

export function unique<T>(list: T[]) {
    return Array.from(new Set(list))
}

// Cosmos...
export type QueryParameters = Array<{
    name: string,
    value: any,
}>

const OptimizedFeedOption = { 
    enableCrossPartitionQuery: true, 
    maxDegreeOfParallelism: -1, 
    maxItemCount: -1 
}

export function convertParameter(parameters: Array<any>) : QueryParameters {
    return parameters.map((v, k) => {
        return {
            name: `@param${k}`,
            value: v,
        }
    })
}

export const queryContainer = async (container: Container, query: string, parameters?: unknown[]): Promise<Resource[]> => {
    let response: FeedResponse<Resource>
    let queryParameters: QueryParameters = []
    if (parameters) {
        queryParameters = convertParameter(parameters)
        queryParameters.map((v) => {
            query = query.replace("?", v.name)
        })
        response = await container.items.query({ query, parameters: queryParameters }, OptimizedFeedOption).fetchAll()
    } else {
        response = await container.items.query({ query }, OptimizedFeedOption).fetchAll()
    }
    return response.resources
}

export const CreateDocument = async (data: unknown, container: Container) => {
    const response = await container.items.create(data)
    const { resource: item } = response
    return item
}

export const sleep = (time) => {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}