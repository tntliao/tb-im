<template>
	<view class="page">
		<view class="content">
			<view class="main">
				<view class="main-content">
					<view class="msg">
						<text>钱包地址</text>
					</view>
					<view class="address" @click="copy">
						{{address}}
					</view>
					<view class="msg-type">
						<text class="usdt">USDT</text>
						<input class="uni-input" type="number" v-model="amount" placeholder-class="placeholder" focus
							placeholder="请输转出金额" />
					</view>
					<view class="msg-introduce">
						<text class="first">余额 {{user_info.money}}<text class="all"
								@tap="allWithDraw">全部转出</text></text>
					</view>
					<view class="button">
						<button class="withdraw" type="button" @tap="withdrawMoney">确认转出</button>
					</view>
					<view class="withdraw-msg">
						<text>转出手续费为{{withdraw.fee}}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import uniPopup from '@/components/uni-popup/uni-popup.vue';
	import UniPopupList from '@/components/uni-popup/uni-popup-list.vue';
	import _get from '../../../common/_get';
	import _hook from '../../../common/_hook';
	import _data from '../../../common/_data';
	import tp from "tp-js-sdk"
	export default {
		data() {
			return {
				user_info: {
					money: 0.00
				},
				withdraw: {
					fee: '0%',
					min_amount: 0
				},
				bottomData: [],
				amount: "",
				selectList: 0,
				address: "null",
			}
		},
		watch: {
			amount(newval) {
				clearTimeout(this.timer);
				this.timer = setTimeout(() => {
					const arr = String(newval).split(".");
					this.amount = arr[0];
				}, 300)
			}
		},
		components: {
			uniPopup,
			UniPopupList
		},
		onShow() {
			// #ifdef H5
			if (tp.isConnected()) {
				tp.getCurrentWallet()
					.then(res => {
						console.log(res, 'res');
						this.address = res.data.address;
					})
			}
			// #endif

			const gw_info = uni.getStorageSync("gw_infohttp://tntliao.cn/#/item?id=57");
			console.log(gw_info, '---------------');
			this.address = gw_info.wallet;

			let _this = this;
			_hook.routeTabBarHook();
			_this.user_info = _data.data('user_info');

			/** 监听新的个人数据 */
			uni.$on('data_user_info', function(data) {
				_this.user_info = data;
			});

			_get.getWithDrawConfig({}, function(ret) {
				_this.withdraw.min_amount = ret.user_min_withdraw;
				_this.withdraw.fee = ret.user_withdraw_fee * 100 + "%";
			});
		},
		methods: {
			copy() {
				uni.setClipboardData({
					data: this.address,
					success: function() {
						uni.showToast({
							title: "复制钱包地址成功",
							icon: "none"
						})
					}
				});
			},
			withdrawMoney() {
				if (Math.abs(this.amount) < 50) {
					this.amount = "";
					return uni.showToast({
						'title': '最少转出' + 50 + 'USDT',
						'icon': 'none',
					});
				}


				_get.withDrawMoney({
					amount: this.amount,
					bank_id: 0,
					wallet: this.address
				}, function(ret) {
					uni.showToast({
						title: '区块确认中，请耐心等待!',
						duration: 1000,
						icon: "none"
					});
				}, function(ret) {
					uni.showToast({
						title: ret.msg,
						duration: 1000,
						icon: "none"
					});
				})

			},
			allWithDraw() {
				return this.amount = this.user_info.money;
			}
		}
	}
</script>

<style>
	page {
		background: white;
	}

	.main-content .msg-type text {
		font-size: 40rpx !important;
		font-weight: 600;
	}

	.main-content .msg {
		font-weight: 500;
		font-size: 32rpx;
	}

	.msg-type {
		display: flex;
		align-items: center;
	}

	.main-content .msg,
	.msg-type,
	.msg-input,
	.msg-introduce,
	.withdraw-msg {
		margin-left: 40upx;
		padding-bottom: 30upx;
		padding-right: 40upx;
	}

	.usdt {
		width: 100rpx
	}

	.msg-introduce .first,
	.withdraw-msg text {
		color: #929292;
		/*626880*/
	}

	.main-content .button {
		display: flex;
		justify-content: center;
		align-items: center;
		padding-bottom: 30upx;
	}

	.withdraw {
		background-color: #5693ee;
		color: white;
		height: 80upx;
		line-height: 80upx;
		border-radius: 50upx;
		width: 90%;
	}

	.msg-introduce .all {
		color: #5f5c77;
		margin-left: 40upx;
	}

	.content .list {
		margin-top: 25upx;
	}

	.address {
		margin-left: 40rpx;
		margin-right: 40rpx;
		padding: 20rpx 0;
		padding-left: 15rpx;
		height: 40rpx;
		border-radius: 4rpx;
		background-color: #e6e6e6;
		margin-bottom: 30rpx;
		overflow: hidden;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}


	.content .main {
		display: flex;
		padding: 10upx;
		margin-top: 20upx;
		justify-content: center;
		align-items: center;
	}

	.main .main-content {
		display: flex;
		width: 95%;
		background-color: white;
		flex-direction: column;
		border-radius: 5upx;
		padding-top: 40upx;
		padding-bottom: 40upx;
	}

	.uni-input {
		border-bottom: 1rpx solid #f2f2f2;
		padding-left: 0px !important;
		width: 680rpx;
		font-size: 36rpx;
		margin-left: 20rpx
	}

	.uni-list-item__extra-text {
		font-size: 14px !important;
		margin-right: 20upx;
	}
</style>
