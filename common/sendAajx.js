const basePath = getApp().globalData.http_url;

export default function(method, url, data) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: basePath + url,
			method,
			data,
			success: (res) => {
				resolve(res)
			},
			fail: (err) => {
				reject(err)
			}
		})

	})
}
