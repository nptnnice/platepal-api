class JsonResponse {
  constructor(is_success, error = null, data = null) {
    this.is_success = is_success
    this.error = error
    this.data = data
  }
}

module.exports = JsonResponse
