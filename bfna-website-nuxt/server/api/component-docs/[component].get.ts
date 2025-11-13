import { parseComponentDocs } from '../../../src/utils/parseComponentDocs'

export default defineEventHandler(async (event) => {
  const componentName = getRouterParam(event, 'component')

  if (!componentName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Component name is required'
    })
  }

  try {
    const docs = await parseComponentDocs(componentName)
    return docs
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to parse component ${componentName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
