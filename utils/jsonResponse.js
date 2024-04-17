class JsonResponse {
  constructor(isSucess, error = null, data = null) {
    this.isSucess = isSucess
    this.error = error
    this.data = data
  }
}

module.exports = JsonResponse
