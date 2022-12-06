<template>
	<view class="content" v-html="content">

	</view>
</template>
<script>
	import {
		apiUrl
	} from "@/common/base.js"
	import sendAjax from "@/common/sendAajx.js";
	export default {
		data() {
			return {
				content: "",
			}
		},
		onShow() {
			const gw_info = uni.getStorageSync("gw_info");
			const data = {
				userId: gw_info.userId,
				wallet: gw_info.wallet
			}
			uni.request({
				method: "GET",
				url: apiUrl + "/api/Pageinit/imhome",
				data,
				success: (response) => {
					const content = response.data.notice.info;
					this.content = content;
					// const pattern = /(?<=(img[^>]*src=\\"))[^"]*/;

				}
			})
		},
		methods: {}
	}
</script>
<style scoped lang="scss">
	.content {
		padding: 10rpx;
	}
</style>
