<template>
	<view class="page">

		<!-- #ifdef APP-PLUS -->
		<view class="selectType" v-if="showType">
			<!-- <view class="selectType"> -->
			<view class="box">
				<view class="login">
					登录方式
				</view>
				<view class="type">
					<view class="bn item" @click="selectType(1)">
						<image src="@/static/img/chat/bn.jpg" mode=""></image>
					</view>
					<view class="tron item" @click="selectType(0)">
						<image src="@/static/img/chat/tron.jpg" mode=""></image>
					</view>
				</view>
			</view>
		</view>
		<!-- #endif -->

		<uni-search-bar ref="searchBar" placeholder="搜索聊天记录" :show="false" @confirm="search" @search="search">
		</uni-search-bar>
		<view class="uni-list" v-if="list.length">
			<uni-swipe-action>
				<uni-swipe-action-item class="uni-list-cell" v-for="(value,key) of list" :key="key"
					:right-options="swipeData(value,key)" :auto-close="false" @click="swipeAction">
					<view class="uni-media-list" @tap="goMessage(value.list_id,key,value.no_reader_num,value.chat_id)">
						<view class="uni-media-list-logo">
							<image :src="getNewAvatar( staticPhoto , value.photo_path)" :lazy-load="true"
								style="border-radius: 10px;" :data-index="key" @error="imageError" />
						</view>

						<view class="red_num">
							<uni-badge :text="value.no_reader_num" type="error" />
						</view>

						<view class="uni-media-list-body">
							<view class="uni-media-list-text-top">
								<text>{{msgHandle(value.show_name+'',12)}}</text>
								<text style="float: right;color: #8f8f94;font-size: 23upx;">
									{{timestampFormat(value.time)}}
								</text>
							</view>
							<view class="uni-media-list-text-bottom uni-ellipsis">{{value.last_msg+''}}</view>
						</view>

					</view>
				</uni-swipe-action-item>
			</uni-swipe-action>
		</view>

		<view :class="{action_main:showActionMenu}" v-show="showActionMenu" @tap="actionMain">
			<view class="action_base">
				<view class="sj"></view>
				<view class="action_item" @tap="goAction(0)">
					<view class="action_icon">
						<image :src="'../../static/theme/default/chat/chat.png'" :lazy-load="true" />
					</view>
					<text class="action_item_text">发起群聊</text>
				</view>

				<view class="action_item" @tap="goAction(1)">
					<view class="action_icon">
						<image :src="'../../static/theme/default/chat/add_friend.png'" :lazy-load="true" />
					</view>
					<text class="action_item_text">添加好友</text>
				</view>
				<view class="action_item" @tap="goAction(2)">
					<view class="action_icon">
						<image :src="'/static/theme/default/store.png'" :lazy-load="true" />
					</view>
					<text class="action_item_text">我的收藏</text>
				</view>
				<!-- #ifdef APP-PLUS -->
				<view class="action_item" @tap="goScanCode">
					<view class="action_icon">
						<image :src="'../../static/theme/default/chat/scan_code.png'" :lazy-load="true" />
					</view>
					<text class="action_item_text">扫一扫</text>
				</view>
				<!-- #endif -->

			</view>
		</view>

	</view>
</template>

<script>
	// import animate from '../../static/css/chat/animate.css';
	import uniIcon from '../../components/uni-icons/uni-icons.vue';
	import uniBadge from '../../components/uni-badge/uni-badge.vue';
	import uniSwipeAction from '../../components/uni-swipe-action/uni-swipe-action.vue'
	import uniSwipeActionItem from '../../components/uni-swipe-action-item/uni-swipe-action-item.vue'
	import _get from '../../common/_get';
	import _hook from '../../common/_hook';
	import _action from '../../common/_action';
	import _data from '../../common/_data';
	import _page from '../../common/common';
	import uniSearchBar from '@/components/mehaotian-search/mehaotian-search.vue';
	import sendAjax from "@/common/sendAajx.js"

	export default {
		components: {
			uniIcon,
			uniBadge,
			uniSwipeAction,
			uniSwipeActionItem,
			uniSearchBar
		},
		data() {
			return {
				list: [],
				search_list: [],
				list_index: '',
				propsData: {},
				action_menu: false,
				action_menu_num: 0,
				actionId: '',
				toTP: false,
				showType: false,
				mainUrl: "http://api.dragonltd.co/",
				options: [{
					text: '取消',
					style: {
						backgroundColor: '#007aff'
					}
				}, {
					text: '删除',
					style: {
						backgroundColor: '#dd524d'
					}
				}]
			}
		},
		onLoad(props) {
			// #ifdef H5
			let data = {};
			if (props.wallet && props.userId && props.token) {
				data = {
					...props
				}
				this.propsData = data;
			}
			// #endif

		},
		async onShow() {
			// #ifdef APP
			const gw_info = uni.getStorageSync("gw_info");
			if (gw_info.wallet && gw_info.userId && gw_info.token) {
				this.sendAppInit(gw_info)
			} else if (this.toTP) {
				this.check()
				this.toTP = false
			} else {
				this.showType = true;
			}
			// #endif

			// #ifdef H5
			if (this.propsData.wallet && this.propsData.userId && this.propsData.token) {
				const response = await sendAjax("POST", "/im/in/init", this.propsData)
				if (response.data.data.token) {
					const token = uni.getStorageSync("token");
					if (token != response.data.data.token) {
						uni.clearStorageSync();
					}
					uni.setStorageSync('token', response.data.data.token);
					_get.base();
				}
				uni.setStorageSync("gw_info", this.propsData);
			}
			// #endif
			_hook.routeTabBarHook();
			uni.$off('data_chat_list');
			let _this = this,
				chat_list = _data.localData('chat_list');

			/** 监听最新数据 */
			uni.$on('data_chat_list', function(data) {
				_this.list = data;
				// console.log(data[0].last_msg)
				_this.search_list = _this.list;
				// console.log("接收到新数据....");
			});

			/** 加载本地缓存数据，让页面秒速渲染出来 */
			if (chat_list) {
				_this.list = chat_list;
			} else {
				_get.getChatList();
			}
			_this.action_menu = false;

		},
		onUnload() {
			uni.$off('data_chat_list');
		},
		onPullDownRefresh() {
			_get.getChatList();
			setTimeout(function() {
				uni.stopPullDownRefresh();
			}, 300);
		},
		onHide() {
			//清空search框
			if (this.keyword) {
				this.$refs.searchBar.clear();
				this.list = this.search_list;
			}
		},

		computed: {
			showActionMenu() {
				return this.action_menu;
			},
			staticPhoto() {
				return _data.staticPhoto();
			},
			imgRan() {
				return Math.random();
			},
		},
		methods: {
			getNewAvatar(a, b) {
				const path = a + b;
				return path.replace("/300.jpg", "/50.jpg")
			},
			selectType(type) {
				// 拉起tp登录
				let num = parseInt(Math.random() * 10000)
				num = num >= 1000 ? '' + num : '0' + num
				this.actionId = new Date().getTime() + num
				console.log("bsc-------------");
				// 生成拉起tp钱包的url参数
				this.url = 'tpoutside://pull.activity?param=' + JSON.stringify({
					"callbackUrl": encodeURIComponent(
						this.mainUrl + "/api/Pageinit/tpcallback"), //登录成功的回调地址
					"action": "login", // 拉起功能  login 登录
					"actionId": this.actionId, // 生成的唯一id，通过该参数从后端获取登录信息
					"blockchains": [{
						"chainId": type ? 12 : 10,
						"network": type ? "bsc" : "tron"
					}],
					"dappIcon": encodeURIComponent("https://chatapi.dragonloo.co/logoloo.png"), //授权登录时显示的图标
					"dappName": "LOOIM", //授权登录时显示的名字
					"protocol": "TokenPocket",
					"version": "2.0"
				})
				this.toTP = true
				plus.runtime.openURL(this.url)
			},
			async sendAppInit(data) {
				const response = await sendAjax("POST", "/im/in/init", data)
				if (response.data.data.token) {
					const token = uni.getStorageSync("token");
					if (token != response.data.data.token) {
						uni.clearStorageSync();
					}
					_get.base();
					uni.setStorageSync('token', response.data.data.token);
				}
				this.showType = false;
				uni.setStorageSync("gw_info", data);
			},
			getInitData(wallet) {
				console.log('wallet', '------------wallet-------------');
				uni.request({
					method: "POST",
					url: this.mainUrl + "/api/Pageinit/home",
					data: {
						wallet
					},
					success: (res) => {
						if (res.data.status == 1) {
							const data = {
								userId: res.data.userId,
								token: res.data.token,
								wallet: res.data.wallet,
							}
							uni.setStorageSync("gw_info", data);
							this.sendAppInit(data);
						}
					},
				})
			},
			check() {
				console.log("this.actionId", this.actionId);
				uni.request({
					method: "GET",
					url: this.mainUrl + "/api/Pageinit/getuactionid",
					data: {
						actionId: this.actionId
					},
					success: (res) => {
						console.log(res, '钱包地址');
						if (res.data.status == 1)
							this.getInitData(res.data.data.wallet)
					},
					fail: (err) => {
						console.log(err, 'err');
					}
				})
			},
			search(chat_msg) {
				chat_msg = chat_msg.trim();
				let _this = this;
				_this.keyword = chat_msg;
				console.log(!chat_msg)
				if (!chat_msg) {
					_this.list = _this.search_list;
					return true;
				}
				_get.serchChatMsg({
					'chat_msg': chat_msg
				}, function(data) {
					_this.list = data;
				})
			},
			goPath(path) {
				if (path) {
					uni.navigateTo({
						url: path
					})
				}
			},
			imageError(e) {
				let index = e.currentTarget.dataset.index
				//替换index对应的图片
				this.list[index].photo_path = '/default_photo_path.png';
			},
			msgHandle(msg, num) {
				if (num == undefined) num = 16;
				if (!msg) return '';
				msg = msg.replace(/&lt;/g, '<');
				return msg.length > num ? msg.substr(0, num) + '...' : msg;
			},
			timestampFormat(time) {
				return _action.timestampFormat(time);
			},
			goAction(type) {
				let path = '';
				switch (type) {
					case 0:
						path = '../friend/index_list?list_id=0';
						break;
					case 1:
						path = '../friend/add';
						break;
					case 2:
						path = '../my/store';
						break;
					default:
						return;
						break;
				}
				uni.navigateTo({
					url: path,
					animationType: 'slide-in-bottom',
				});
			},
			actionMain() {
				this.action_menu = !this.action_menu;
				this.action_menu_num++;
			},
			openedAction(key) {
				this.list_index = key;
			},
			swipeAction(e) {
				let list_index = e.content.number
				let _this = this,
					list_id = _this.list[list_index].list_id;
				if (!list_id) {
					return;
				}
				let top = _this.list[list_index].top;
				console.log("top", top)
				let value = top == 1 ? 0 : 1;
				console.log("value", value)
				switch (e.index) {
					case 0:
						//置顶 /取消置顶
						_this.$httpSend({
							path: '/im/message/chatTop ',
							data: {
								list_id: list_id,
								value: value
							},
							success: () => {
								_get.getChatList();
							}
						});
						break;
					case 1:
						/** 删除这条对话 */
						_this.$httpSend({
							path: '/im/chat/deleteChat',
							data: {
								list_id,
							},
							success: (data) => {
								uni.removeStorageSync("list_id")
								_get.getChatList();
							}
						});
						break;
					default:
						break;
				}
			},
			swipeData(value, index) {
				return [{
						text: value.top == 1 ? '取消置顶' : '置顶',
						number: index,
						style: {

						},
					},
					{
						text: '删除',
						number: index,
						style: {
							backgroundColor: 'rgb(255,58,49)',
						}
					}
				];
			},
			goMessage(list_id, key, no_reader_num, chat_id) {
				if (no_reader_num > 0) {
					_get.getChatData({
						send_data: {
							list_id: list_id,
							time: 0,
							is_up: 1,
						},
						is_action_data: 1,
					});
					this.list[key].no_reader_num = 0;
					_data.localData('chat_list', this.list);
					_action.updataNoReader(list_id);
					_action.setStatusTips();
				}
				console.log("chat_id", chat_id);
				_data.localData('message_list_id', list_id);
				// './message?list_id=' + list_id + "&chat_id="+chat_id,
				uni.navigateTo({
					url: './message?list_id=' + list_id
				});
			},
			goScanCode() {
				let _this = this;
				_this.action_menu = false;
				_page.scanCode();
			},
		},
		watch: {

		},
		onNavigationBarButtonTap(e) {
			this.action_menu = !this.action_menu;
		},
	}
</script>

<style>
	.selectType {
		width: 750rpx;
		height: 100%;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 99999;
		background-color: rgba(0, 0, 0, .1);
		display: flex;
		justify-content: center;
		align-items: center;
	}


	.selectType .box {
		width: 440rpx;
		height: 290rpx;
		background-color: white;
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		flex-direction: column;
		align-items: center;
	}

	.selectType .box .login {
		font-size: 30rpx;
		font-weight: bold;
		padding: 20rpx 0;
		padding-top: 30rpx;
		height: 90rpx;
	}

	.selectType .box .type {
		width: 100%;
		height: 200rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-bottom: 30rpx;
	}

	.selectType .box .item {
		width: 80rpx;
		height: 80rpx;
	}

	.selectType .box .item:nth-of-type(1) {
		margin-right: 70rpx;
	}

	.selectType .box .item image {
		width: 100%;
		height: 100%;
	}

	.uni-list-cell {
		overflow: hidden;
	}

	.uni-media-list-logo {
		height: 100upx;
		width: 100upx;
	}

	.search .content {
		padding-left: 20upx;
		height: 60upx;
	}

	.header {
		display: flex;
		flex-direction: row;
		padding: 10px 15px;
		align-items: center;
	}

	.input-view {
		display: flex;
		align-items: center;
		flex-direction: row;
		background-color: #e7e7e7;
		height: 30px;
		border-radius: 5px;
		padding: 0 10px;
		flex: 1;
	}

	.input {
		flex: 1;
		padding: 0 5px;
		height: 24px;
		line-height: 24px;
		font-size: 16px;
	}

	.red_num {
		position: absolute;
		height: 34upx;
		top: 7upx;
		left: 120upx;
		font-size: 23upx !important;
	}

	/**
	.uni-media-list-body {
		height: auto;
	}
	*/

	.uni-swipe-action,
	.uni-swipe,
	.uni-view,
	.uni-media-list {
		width: 750upx !important;
	}

	.action_main {
		position: fixed;
		top: 55px;
		/* #ifndef H5 */
		top: 15px;
		/* #endif */
		width: 750upx;
		height: 1080upx;
		z-index: 10000;
	}

	.action_base {
		position: absolute;
		right: 15upx;
		width: 250upx;
		top: -15upx;
		background: #36363d;
		border-radius: 10upx;
	}

	.sj {
		position: absolute;
		top: -15upx;
		right: 26upx;
		width: 0;
		height: 0;
		border-left: 19upx solid transparent;
		border-right: 19upx solid transparent;
		border-bottom: 19upx solid #36363d;
	}

	.action_item {
		color: #e5e5e5;
		height: 100upx;
		line-height: 100upx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-bottom: 1px solid #3e3e3e;
	}

	.action_icon {
		width: 45upx;
		height: 45upx;
		display: inline-block;
		vertical-align: middle;
		margin-left: 10rpx;
		margin-right: 15rpx;
	}

	.action_icon image {
		width: 100%;
		height: 100%;
	}

	.action_item:last-child {
		border: none;
	}

	.action_item_text {
		font-size: 30upx;
	}
</style>
