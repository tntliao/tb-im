<template>
	<view class="page">
		<view class="uni-checkbox-list">
			<uni-search-bar ref="searchBar" placeholder="搜索文件" :show="false" @confirm="search" @search="search">
			</uni-search-bar>
			<uni-list style="margin: 0;">
				<label class="uni-list-cell uni-list-cell-pd" v-for="(item,index) in list_data" :key="index">
					<view class="checkbox-detail" @tap="downFile(item)">
						<view class="icon">
							<image @error="imageError3" :data-id="index" :src="('/static/theme/default/chat/' + item.filetype + '.png')"></image>
						</view>
						<view class="info">
							<text>{{item.filename}}</text>
							<text class="name">{{item.username}}<span>{{item.addtime}}</span></text>
						</view>
					</view>
					<view class="checkfile" v-if="is_action" @tap="delfile(item,index)">移除</view>
				</label>
			</uni-list>
		</view>
	</view>
</template>

<script>
	import uniIcon from '../../../components/uni-ui/uni-icon/uni-icon.vue';
	import uniList from '../../../components/uni-ui/uni-list/uni-list.vue';
	import uniListItem from '../../../components/uni-ui/uni-list-item/uni-list-item.vue';
	import uniSwipeAction from '../../../components/uni-ui/uni-swipe-action/uni-swipe-action.vue'
	import _get from '../../../common/_get';
	import _hook from '../../../common/_hook';
	import _data from '../../../common/_data';
	import _action from '../../../common/_action';
	import uniSearchBar from '@/components/mehaotian-search/mehaotian-search.vue'
	import _mixins from '../../../common/_mixins';
	export default {
		components: {
			uniIcon,
			uniList,
			uniListItem,
			uniSwipeAction,
			uniSearchBar,
		},
		computed: {
			staticPath() {
				return _data.staticChat() + this.list_id + '/';
			}
		},
		data() {
			return {
				list_data: [],
				search_list:[],
				searchkey:"",
				is_action: 0,
			}
		},
		onShow() {
			_hook.routeTabBarHook();
			let _this = this,file_list;	
			/** 加载本地缓存数据，让页面秒速渲染出来 */
			if (file_list) {
				_this.list_data = file_list;
			} else {
				let send_data = {};
				_this.$httpSend({
					path: '/im/get/filelist',
					data: { list_id: _this.list_id,searchkey:_this.searchkey },
					success_action: true,
					success(res) {
						_this.list_data = res.data.data;
					}
				});
				//_get.getFileList();
			};
			_this.$httpSend({
				path: '/im/message/getChatDetails',
				data: { list_id: _this.list_id, },
				success(data) {
					_this.is_action = data.is_action;
				}
			});
		},
		onHide() {
			//uni.$off('data_file_list');
			//清空search框
			if (this.keyword) {
				this.$refs.searchBar.clear();
				this.list_data = [];
			}
		},
		onLoad(option) {
			this.list_id = option.list_id;
		},
		methods: {
			search(keyword) {
				this.searchkey = keyword.trim();
				let _this = this;
				/*
				if (!keyword) {
					console.log(_this.search_list)
					_this.list_data = _this.search_list;
					return true;
				}
				*/
				_this.$httpSend({
					path: '/im/get/filelist',
					data: { list_id: _this.list_id,searchkey:_this.searchkey },
					success_action: true,
					success(res) {
						//console.log(res);
						_this.list_data = res.data.data;
					}
				});
			},
			downFile(msg){
				console.log(msg.filename);
				let url = this.staticPath + msg.url;
				let name = msg.filename;
				//查看文件是否存在
				//app 下载
				// #ifdef APP-PLUS
				plus.io.resolveLocalFileSystemURL("_downloads/"+name,function(entry) {
			        if(entry.file)
					{
						let localPath = plus.io.convertLocalFileSystemURL("_downloads/"+name);
						plus.runtime.openFile("_downloads/"+name,{},function(e) {
							uni.showToast({
								title: '文件无法打开,文件路径：' + localPath,
								icon:'none',
								duration: 4000
							});
						});	   //选择软件打开文件
					}
			    },function(e) {
					uni.showLoading({
						title: '下载中...'
					})
					var dtask = plus.downloader.createDownload(url,{
						filename:"_downloads/"+name            //利用保存路径，实现下载文件的重命名
					},function(d,status){
						uni.hideLoading()
						//console.log('d', d, status)
						//d为下载的文件对象
						if(status==200){
							//console.log('下载成功')
							uni.showModal({
								content: '下载完成，是否打开？',
								success(res){
									if(res.confirm) { 
										//下载成功,d.filename是文件在保存在本地的相对路径，使用下面的API可转为平台绝对路径
										this.localPath = plus.io.convertLocalFileSystemURL(d.filename);
										plus.runtime.openFile(d.filename);	   //选择软件打开文件
									}
								},
							});
					    }else{
							//console.log('下载失败')
					    	//下载失败
							uni.showToast({
								title: "  下载失败  ",
								icon: "none"
							});
					    	plus.downloader.clear();        //清除下载任务
					    }
					})
					dtask.start();
				});
				// #endif
				// h5端下载
				// #ifdef H5
				console.log(url);
				let dload = document.createElement("a");
				dload.download = name;// 设置下载的文件名，默认是'下载'
				dload.href = url;
				document.body.appendChild(dload);
				dload.click();
				dload.remove(); // 下载之后把创建的元素删除
				// #endif
			},
			delfile(item,index){
				let _this = this;
				uni.showModal({
	　　　　　　　　title: '删除文件',
	　　　　　　　　content: '确定要删除这个文件？',
	　　　　　　　　success:async function(res) {
	　　　　　　　　		if (res.confirm) {
	　　　　　　　　　　　　_this.$httpSend({
								path: '/im/set/filedel',
								data: {
									id: item.id
								},
								success(res) {
									if (res.err == 0)
									{
										_this.list_data = _this.list_data.filter((i) => {
											return i != item
										});
										uni.showToast({
											title:"删除完成"
										});
									}
									else
									{
										uni.showToast({
											title:"删除失败",
											icon:"error"
										});
									}
								}
							});
		　　　　　　　　}
					}
				});
			},
			imageError3(e) {
				let index = e.currentTarget.dataset.id;
				console.log("图片加载失败:", index);
				this.list_data[index].filetype = 'error';
				
			},
		}
	}
</script>

<style>
.month-text{
	padding: 8px 10px;
	position: relative;
}
.month-text .month{
	
}
.month-text .file_down_btn{
	position: absolute;
	right: 16px;
	top: 5px;
	width: 60px;
	height: 34px;
	font-size: 14px;
	color: #FFFFFF;
	border-radius: 8px;
	background-color: #00BFFF;
	
}
.uni-list-cell {
    justify-content: flex-start;
	bottom-top: 1px solid #CCCCCC;
	height: auto !important;
}
.checkbox-detail .icon image{
	float: left;
	width: 70rpx;
	height: 90rpx;
}
.checkbox-detail .info{
	margin-left: 100rpx;
	margin-top: 10rpx;
	font-size: 14px;
}
.checkbox-detail .info text{
	display: block;
	line-height: 40rpx;
}
.checkbox-detail .info .name {
	font-size: 12px;
}
.checkbox-detail .info .name span{
	color: #cccccc;
	margin-left: 10px;
}
.checkfile{
	position: absolute;
	right: 16px;
	top:16px;
	padding: 5px 15px;
	color: #FFFFFF;
	border-radius: 8px;
	background-color: #00B26A;
}
</style>
