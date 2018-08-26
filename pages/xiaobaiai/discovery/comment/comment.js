// pages/xiaobaiai/discovery/comment/comment.js
const AV = require('../../../../libs/leancloud/av-weapp-min.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    original_discovery_id: "",
    discovery_id: "",
    nickname: '',
    avatarUrl: '',
    time: '',
    content: '',
    user_id: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('discovery comment onLoad')
    var that = this;
    //console.log(options);
    that.data.original_discovery_id = options.discovery_id;
    that.setData({
      discovery_id: "discovery_" + options.discovery_id,
      nickname: options.nickname,
      avatarUrl: options.avatarUrl,
      time: options.time,
      content: options.content,
      user_id: options.user_id
    })

    // 更新targetCommentCount到WxDiscovery
    var query = new AV.Query('WxCommentCount');
    query.equalTo('article_id', that.data.discovery_id)
    query.find().then(function (results) {
      //console.log(results);
      if(results.length == 1) {
        // 更新targetCommentCount       
        var wxdiscovery = AV.Object.createWithoutData('WxDiscovery', that.data.original_discovery_id);
        var targetCommentCount = AV.Object.createWithoutData('WxCommentCount', results[0].id);
        wxdiscovery.set('targetCommentCount', targetCommentCount);
        wxdiscovery.save().then(function (wxdiscovery) {
          // nothing to do
        }), function (error) {
          console.log('更新targetCommentCount到WxDiscovery失败！')
          console.log(error)
        }
      }
      else if(results.length > 1) {
        console.log('WxCommentCount article_id 有重复。')
      }
      else {
        console.log('还未创建WxCommentCount对象。')
      }

    }, function (error) {
      console.log(error)
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var that = this;

    return {
      title: 'Discovery',
      path: '/pages/xiaobaiai/discovery/comment/comment?discovery_id=' + that.data.original_discovery_id + '&avatarUrl=' + that.data.avatarUrl + '&time=' + that.data.time + '&nickname=' + that.data.nickname + '&content=' + that.data.content + '&user_id=' + that.data.user_id
    }
  },
  
  zandiscoveryClick: function() {
    wx.showToast({
      title: '暂未支持',
      icon: 'none',
      duration: 2000
    })
  },
  followClicked: function() {
    wx.showToast({
      title: '暂未支持',
      icon: 'none',
      duration: 2000
    })
  },
  avatarClicked: function() {
    wx.showToast({
      title: '暂未支持',
      icon: 'none',
      duration: 2000
    })
  }
})