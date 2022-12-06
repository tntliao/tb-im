<template>
	<view>
		<web-view :src="url"></web-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				url:'http://www.baidu.com'
			}
		},
		onLoad(options) {
			this.url='http://'+options.url;
			console.log("即将打开"+options.url);
		},
		methods: {
			
		}
	}
</script>

<style>

</style>
