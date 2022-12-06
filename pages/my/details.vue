<template>
	<view class="page">
		<!-- <view class="selectType" v-if="showType">
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
		</view> -->

		<view class="uni-list">
			<view class="uni-list-cell" @tap="goSet('3')">
				<view class="uni-media-list uni-list-cell-navigate uni-navigate-right">
					<text>头像</text>
					<view class="uni-media-list-logo photo">
						<image :src="myPhoto" :lazy-load="true" style="border-radius: 10upx;" />
					</view>
				</view>
			</view>
		</view>

		<view class="uni-card">
			<view class="uni-list">
				<view class="uni-list-cell" @tap="goSet('0')">
					<view class="uni-list-cell-navigate uni-navigate-right">
						<view>
							<text>昵称</text>
							<view class="show_text">{{info.nickname}}</view>
						</view>
					</view>
				</view>

				<view class="uni-list-cell">
					<view class="uni-list-cell-navigate">
						<view>
							<text>账号</text>
							<view class="show_text">{{info.username}}</view>
						</view>
					</view>
				</view>

				<view class="uni-list-cell" @tap="goSet('1')">
					<view class="uni-list-cell-navigate uni-navigate-right">
						<view>
							<text>个性签名</text>
							<view class="show_text">{{info.doodling}}</view>
						</view>
					</view>
				</view>

				<view class="uni-list-cell" @tap="goSet('4')">
					<view class="uni-media-list uni-list-cell-navigate uni-navigate-right">
						<text>我的二维码</text>
						<view class="uni-media-list-logo photo_qrcode">
							<image src="/static/theme/default/my/qrcode.png" :lazy-load="true" />
						</view>
					</view>
				</view>

				<view class="uni-list-cell" @tap="goSet('2')">
					<view class="uni-list-cell-navigate uni-navigate-right">
						<view>
							<text>性别</text>
							<view class="show_text">{{[ '男','女' ][info.sex]}}</view>
						</view>
					</view>
				</view>

				<view class="uni-list-cell" v-if="0">
					<view class="uni-list-cell-navigate uni-navigate-right">
						<view>
							<text>更多</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- #ifdef APP-PLUS -->
		<view class="switchAccount" @click="switchAccount">
			切换账号
		</view>
		<!-- #endif -->

	</view>

</template>

<script>
	import _get from '../../common/_get';
	import _hook from '../../common/_hook';
	import _data from '../../common/_data';

	export default {

		components: {

		},
		data() {
			return {
				// showType: false,
				info: {},
			}
		},
		onShow() {
			_hook.routeSonHook();
			let _this = this;
			_this.info = _data.data('user_info');
			/** 监听新的个人数据 */
			uni.$on('data_user_info', function(data) {
				_this.info = data;
			});
		},
		onLoad(option) {

		},
		onUnload() {
			uni.$off('data_user_info');
		},
		computed: {
			myPhoto() {
				return _data.staticPhoto() + this.info.photo;
			},
		},
		onBackPress(options) {
			if (options.from === 'navigateBack') {
				return false;
			}
			this.back();
			return true;
		},
		methods: {
			/* selectType(type) {
				console.log(type);
			}, */
			switchAccount() {
				// this.showType = true
				uni.clearStorageSync();
				uni.reLaunch({
					url: '/pages/chat/index'
				});
			},
			back() {
				uni.reLaunch({
					url: '/pages/chat/index',
				});
			},
			goSet(type) {
				let url;
				switch (type) {
					case '0':
					case '1':
					case '2':
						url = '../set/user?type=' + type;
						break;
					case '3':
						url = '../set/photo';
						break;
					case '4':
						url = './qrcode';
						break;
					default:
						return;
						break;
				}
				uni.navigateTo({
					url: url,
					animationType: 'slide-in-bottom',
				});
			}
		},
		watch: {

		},
	}
</script>

<style>
	/* .selectType {
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
 */
	.uni-media-list-logo {
		width: 30upx;
		height: 30upx;
		display: inline-block;
		vertical-align: middle;
	}

	.photo_qrcode {
		width: 52upx;
		height: 52upx;
		margin-left: 30upx;
		margin-right: 50upx;
	}

	.photo {
		width: 106upx;
		height: 106upx;
		margin-left: 30upx;
		margin-right: 50upx;
	}

	.uni-card {
		box-shadow: none;
	}

	.show_text {
		position: absolute;
		right: 60upx;
		color: #8f8f94;
		display: inline-block;
	}

	.uni-navigate-right.uni-media-list {
		padding-right: 23upx;
	}

	.switchAccount {
		width: 750rpx;
		height: 100rpx;
		text-align: center;
		line-height: 100rpx;
		background-color: white;
		border-radius: 8rpx;
	}
</style>
