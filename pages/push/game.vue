<template>

	<view class="page">
		<uni-list class="item-list">
			<uni-list-item title="生活圈" class="item-list-item" :show-arrow="true" :show-badge="true" badge-type="error"
				:showArrow="true" :badge-text="show_tips" thumb="/static/theme/default/push/circle.png"
				@click="goPath('../push/circle')" />
			<!--  #ifdef  APP-PLUS -->
			<!-- <uni-list-item title="扫一扫" :show-arrow="false" :show-badge="false" badge-type="error" :showArrow="true"
				thumb="/static/theme/default/push/scan.png" @click="goScanCode" /> -->
			<!-- #endif -->
			<!-- #ifdef H5 -->
			<!-- <uni-list-item title="DEFI" class="item-list-item" :show-arrow="true" :show-badge="true" badge-type="error"
				:showArrow="true" :badge-text="show_tips" thumb="/static/theme/default/push/huaban.png"
				@click="toGame('http://defi123.dragonltd.co/#/')" />
				
			<uni-list-item title="LOO" class="item-list-item" :show-arrow="true" :show-badge="true" badge-type="error"
				:showArrow="true" :badge-text="show_tips" thumb="/static/theme/default/push/LOO.png"
				@click="toGame('http://game123.dragonltd.co/#/')" />
				
			<uni-list-item title="偷偷乐" class="item-list-item" :show-arrow="true" :show-badge="true" badge-type="error"
				:showArrow="true" :badge-text="show_tips" thumb="/static/theme/default/push/ttl.jpg"
				@click="toGame('http://farm123.dragonltd.co/')" />
				
			<uni-list-item title="SWAP" class="item-list-item" :show-arrow="true" :show-badge="true" badge-type="error"
				:showArrow="true" :badge-text="show_tips" thumb="/static/theme/default/push/SWAP.png"
				@click="toGame('http://swap123.dragonltd.co/#/')" /> -->
			<!-- #endif -->

			<!--自定义网址-->
			<uni-list-item :title="item.appName" v-if="list.length" v-for="(item,index) in list" :show-arrow="false"
				:show-badge="false" badge-type="error" :showArrow="true" :thumb="domainUrl +item.logo_url"
				@click="goPath('web?url='+item.url+'&title='+item.appName+'&agent_user_id='+item.agent_user_id )" />
		</uni-list>

	</view>

</template>

<script>
	import _hook from '../../common/_hook';
	import _data from '../../common/_data';
	import _get from '../../common/_get';
	import uniList from '../../components/uni-ui/uni-list/uni-list.vue';
	import uniListItem from '../../components/uni-ui/uni-list-item/uni-list-item.vue';
	export default {
		components: {
			uniList,
			uniListItem
		},
		data() {
			return {
				list: [],
				show_tips: ''
			}
		},
		onShow() {
			let _this = this;
			_hook.routeTabBarHook();
			_get.getOnlineList({}, function(res) {
				_this.list = res
			});
			let num = _data.data('no_reader_circle_chat_num');
			/** 监听朋友圈动态提示 */
			uni.$on('data_circle_tips', function(data) {
				_this.show_tips = data;
			});
			if (num) {
				this.show_tips = num;
			} else if (_data.data('no_reader_circle')) {
				this.show_tips = '好友动态';
			} else {
				this.show_tips = '';
			}
		},
		onLoad() {

			// #ifdef APP-PLUS
			// #endif
		},
		computed: {
			domainUrl() {
				return _data.domainUrl();
			},
		},
		methods: {
			toGame(url) {
				const gw_info = uni.getStorageSync("gw_info");
				console.log(gw_info);
				if (gw_info.wallet && gw_info.userId && gw_info.token) {
					const params = `?wallet=${gw_info.wallet}&userId=${gw_info.userId}&token=${gw_info.token}`
					const path = url + params;
					window.open(path)
				}
			},
			goPath(path) {
				if (path) {
					uni.navigateTo({
						url: path
					});
				}
			},
			goScanCode() {
				// uni.navigateTo({
				//   url: '../chat/videoCall'
				// });
				let _this = this;
				uni.scanCode({
					success: function(res) {
						/** 验证必须是一个地址 */
						if (/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\*\+,;=.]+$/.test(
								res.result)) {
							/** 本应用页面 */
							console.log(res.result);
							if (new RegExp(_data.data('http_url')).test(res.result)) {
								if (res.result.match(/\/([a-z]+_[a-z]+)\/(.+)$/) && RegExp.$1 && RegExp.$2) {
									switch (RegExp.$1) {
										case 'chat_add':
											uni.navigateTo({
												url: '/page/details/index?user_id=' + RegExp.$2 +
													'&is_type=3',
											});
											break;
										case 'group_add':
											let option = (RegExp.$2 + '').split('&');
											_this.$httpSend({
												path: '/im/message/addChat',
												data: {
													users: option[1],
													list_id: option[0],
													type: 1,
												},
												success_action: true,
												success(res) {
													let tips = res.err ? res.msg :
														'已经申请加入群聊,请耐心等待群管理审核';
													uni.showModal({
														content: tips,
														showCancel: false,
													});
												}
											});
											break;
										default:
											uni.showModal({
												content: '二维码内容1：' + res.result,
												showCancel: false,
											});
											break;
									}
								} else {
									uni.showModal({
										content: '二维码内容2：' + res.result,
										showCancel: false,
									});
								}
							} /** 打开新地址 */
							else {
								uni.navigateTo({
									url: '../push/web?url=' + encodeURIComponent(res.result),
								});
							}
						} else {
							uni.showModal({
								content: '二维码内容3：' + res.result,
								showCancel: false,
							});
						}
					},
					fail(e) {
						console.log(e);
						return false;
						return;
						uni.showToast({
							title: '扫码错误：' + JSON.stringify(e),
							duration: 2000,
						});
					},
				});
			},
		},
	}
</script>

<style>
	.item-list {
		margin-top: 40upx;
	}
</style>
