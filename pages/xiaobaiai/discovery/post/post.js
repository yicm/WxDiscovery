// pages/xiaobaiai/discovery/post/post.js
const AV = require('../../../../libs/leancloud/av-weapp-min.js');
// LeanCloud 应用的 ID 和 Key
// SDK is already initialized.

Page({
  /**
   * 页面的初始数据
   */
  data: {
    show_aur_button: false,
    user_info: [],
    login_user_info: [],
    placeholder: "佛性吐槽？想找个女朋友？佛性爆照？写鸡汤？......。[长度限制为400个字符😃]",
    textarea_value: "",
    textarea_min_len: 2,
    textarea_max_len: 400,
    submit_btn_disabled: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;

    // 获取用户信息
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo']) {
          console.log("没有授权获取用户信息");
          wx.showToast({
            title: '没有授权获取用户信息',
            icon: 'none',
            duration: 2000
          })
          that.setData({
            show_aur_button: true,
            placeholder: "未授权获取用户头像和昵称，请先授权哦。"
          });
        } else {
          console.log("已经授权获取用户信息，开始获取信息");

          wx.getUserInfo({
            success: function (res) {
              that.setData({
                user_info: res.userInfo
              });
              // LeanCloud 用户一键登录
              AV.User.loginWithWeapp().then(user => {
                //console.log('user...');
                //console.log(user);
                that.data.login_user_info = user.toJSON();
                //console.log(that.data.login_user_info);
                // 更新LeanCloud用户信息
                that._updateUserInfoInLeanCloud();
              }).catch(console.error);
            }
          })
        }
      }, fail: function () {
        console.log("获取用户的当前设置失败");
      }
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

  },
  _updateUserInfoInLeanCloud: function () {
    // 获得当前登录用户
    const user = AV.User.current();
    // 调用小程序 API，得到用户信息
    wx.getUserInfo({
      success: ({ userInfo }) => {
        // 更新当前用户的信息
        user.set(userInfo).save().then(user => {
          // 成功，此时可在控制台中看到更新后的用户信息
          this.data.login_user_info = user.toJSON();
        }).catch(console.error);
      },
      fail: function () {
        console.log("获取用户信息失败");
      }
    });
  },
  onGetUserInfo: function (e) {
    var that = this;
    if (e.detail.userInfo) {
      //console.log(e.detail.userInfo);
      wx.showToast({
        title: '授权成功！',
        icon: 'success',
        duration: 2000
      })
      that.setData({
        user_info: e.detail.userInfo,
        show_aur_button: false,
        placeholder: "佛性吐槽？想找个女朋友？佛性爆照？写鸡汤？长度限制为400个字符😃"
      });
      // LeanCloud 一键登录
      AV.User.loginWithWeapp().then(user => {
        that.data.login_user_info = user.toJSON();
        // 更新LeanCloud用户信息
        that._updateUserInfoInLeanCloud();
      }).catch(console.error);
    }
  },
  bindPostFormSubmit: function (e) {
    //console.log(e.detail.value.textarea);
    var that = this;
    // 判断内容是否满足要求
    if (e.detail.value.textarea.length <= that.data.textarea_min_len) {
      wx.showToast({
        title: '内容长度不够[' + that.data.textarea_min_len + ']',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    that.setData({
      submit_btn_disabled: true
    })
    // 每次发布同时同步用户信息
    wx.getUserInfo({
      success: function (res) {
        that.setData({
          user_info: res.userInfo
        });
        // LeanCloud 用户一键登录
        AV.User.loginWithWeapp().then(user => {
          //console.log('user...');
          //console.log(user);
          that.data.login_user_info = user.toJSON();
          //console.log(that.data.login_user_info);
          // 更新LeanCloud用户信息
          that._updateUserInfoInLeanCloud();
          // 写入评论
          // 写入并更新显示评论
          that._writeDiscoveryInLeanCloud(e.detail.value.textarea);
        }).catch(console.error);
      }
    })
  },
  _getTime: function () {
    //获取当前时间戳  
    var timestamp = Date.parse(new Date());
    var n = timestamp;
    var date = new Date(n);
    //年  
    var Y = date.getFullYear();
    //月  
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
    //日  
    var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    //时  
    var h = date.getHours();
    //分  
    var m = date.getMinutes();
    //秒  
    var s = date.getSeconds();
    return Y + '-' + M + '-' + D + ' ' + h + ":" + m + ":" + s;
  },
  // 自定义方法
  _writeDiscoveryInLeanCloud: function (content) {
    var that = this;
    // new WxDiscovery
    var WxDiscovery = AV.Object.extend('WxDiscovery');
    var wxdiscovery = new WxDiscovery();

    var current_time = that._getTime();
    const user = AV.User.current();
    //console.log(that.data.login_user_info);
    wxdiscovery.set('username', that.data.login_user_info.username);
    wxdiscovery.set('content', content);
    wxdiscovery.set('time', current_time);
    var targetUser = AV.Object.createWithoutData('_User', user.id);
    wxdiscovery.set('targetUser', targetUser);

    wxdiscovery.save().then(function (wxdiscovery) {
      // new WxDiscoveryZan
      var WxDiscoveryZan = AV.Object.extend('WxDiscoveryZan');
      var wxdiscoveryzan = new WxDiscoveryZan();
      wxdiscoveryzan.set('zan', 0);
      wxdiscoveryzan.set('discoveryObjId', wxdiscovery.id);
      wxdiscoveryzan.set('userList', []);
      wxdiscoveryzan.save().then(function (wxdiscoveryzanzan) {
        var targetZan = AV.Object.createWithoutData('WxDiscoveryZan', wxdiscoveryzan.id);
        wxdiscovery.set('targetZan', targetZan);
        wxdiscovery.save().then(function (wxdiscovery) {
          // 发布处理完毕：发布内容信息/赞/评论/初始化
          // do something...
          console.log("发布处理完毕");
          that.setData({
            textarea_value: ''
          })
          wx.showToast({
            title: '发布成功！',
            icon: 'success',
            duration: 2000
          });
          setTimeout(function () {
            console.log('发布成功后定时执行');
            that.setData({
              submit_btn_disabled: false
            })
            var pages = getCurrentPages();
            var currPage = pages[pages.length - 1];   //当前页面
            var prevPage = pages[pages.length - 2];   //上一个页面
            // 处理数据传递，更新发现内容
            var item = {
              id: wxdiscovery.id,
              userId: user.id,
              zanId: targetZan.id,
              avatarUrl: that.data.login_user_info.avatarUrl,
              nickName: that.data.login_user_info.nickName,
              time: current_time,
              followNum: 0,
              zanNum: 0,
              commentNum: 0,
              content: content,
              zanCurrent: false
            }
            prevPage.data.leancloud_discovery_data.splice(0, 0, item)
            prevPage.setData({
              leancloud_discovery_data: prevPage.data.leancloud_discovery_data
            })
            wx.navigateBack({
              
            })
          }, 2000)
        }), function (error) {
          wx.showToast({
            title: '发布处理失败！',
            icon: 'none',
            duration: 2000
          })
        }
      }), function (error) {
        // 异常处理
        wx.showToast({
          title: '赞初始化失败！',
          icon: 'none',
          duration: 2000
        })
      }
    }, function (error) {
      // 异常处理
      wx.showToast({
        title: '发布失败！',
        icon: 'none',
        duration: 2000
      })
    });
  }
})