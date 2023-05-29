const DEFAULT_PAGE_NUMBER = 1
const DEFAULT_LIMIT = 0

function getPagination(query) {
    const limit = query.limit || DEFAULT_LIMIT
    const page = query.page || DEFAULT_PAGE_NUMBER
    const skip = (page - 1) * limit

    return {
      limit,
      skip
    }
}

module.exports = {
  getPagination
}