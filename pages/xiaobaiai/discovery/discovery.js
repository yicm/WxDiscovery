const AV = require('../../../libs/leancloud/av-weapp-min.js');
const app = getApp();

Page({
  data: {
    window_height: 500,
    scroll_top: 0,
    leancloud_user_id: "",
    login_user_info: [],
    leancloud_discovery_data: [],
    tabbar_show: true
  },
  getWxDiscoveryList: function (mode) {
    var that = this;

    // Note: discovery id == 2
    // app.globalData.tabbarCtrl[2].content_show
    // that.data.tabbar_show = app.globalData.tabbarCtrl[2].content_show;
    // 加载评论列表和评论点赞信息
    AV.User.loginWithWeapp().then(user => {
      that.data.leancloud_user_id = user.id;
      that.data.login_user_info = user.toJSON();

      var query = new AV.Query('WxDiscovery');
      // descending:降序/ascending:升序
      query.descending('createdAt');
      // 同时查询包含对象Pointer的详细信息
      query.include('targetUser');
      query.include('targetZan');
      query.include('targetCommentCount');
      query.find().then(function (results) {
        // 处理初次加载的评论
        for (var i = 0; i < results.length; i++) {
          var item = {};
          item['id'] = results[i].id;
          item['userId'] = results[i].attributes.targetUser.id;
          item['zanId'] = results[i].attributes.targetZan.id;

          var zanUserList = results[i].attributes.targetZan.attributes.userList;

          item['zanCurrent'] = false;
          for (var j = 0; j < zanUserList.length; j++) {
            if (zanUserList[j] == that.data.leancloud_user_id) {
              item['zanCurrent'] = true;
              break;
            } else {
              item['zanCurrent'] = false;
            }
          }

          item['zanNum'] = results[i].attributes.targetZan.attributes.zan;
          // TODO followNum/commentNum
          item['followNum'] = 0
          // 初次没有targetCommentCount
          if (results[i].attributes.targetCommentCount) {
            item['commentNum'] = results[i].attributes.targetCommentCount.attributes.count;
          }
          else {
            item['commentNum'] = 0;
          }

          item['nickName'] = results[i].attributes.targetUser.attributes.nickName;
          item['avatarUrl'] = results[i].attributes.targetUser.attributes.avatarUrl;
          item['content'] = results[i].attributes.content;
          item['time'] = results[i].attributes.time;
          that.data.leancloud_discovery_data.push(item);
          if("onPullDown" == mode) {
            wx.stopPullDownRefresh();
          }
        }
        //console.log(that.data.leancloud_discovery_data);
        that.setData({
          tabbar_show: that.data.tabbar_show,
          leancloud_discovery_data: that.data.leancloud_discovery_data
        });
        wx.hideLoading();
      }).catch(console.error);
    }, function (error) {
      wx.showToast({
        title: '发现加载失败！',
        icon: 'none',
        duration: 2000
      })
    });

  },
  /**
 * 生命周期函数--监听页面加载
 */
  onLoad: function (options) {
    var that = this;
    wx.showLoading({
      title: '加载中',
    })
    setTimeout(function () {
      wx.hideLoading()
    }, 8000)

    //console.log('onLoad in discovery')
    that.setData({
      window_height: app.globalData.phoneInfo.windowHeight - 20
    })
    that.getWxDiscoveryList();
  },
  scroll: function (event) {
    this.setData({
      scroll_top: event.detail.scrollTop
    });
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('onShow in discovery')
  },
  /**
 * 用户点击右上角分享
 */
  onShareAppMessage: function () {

  },
  onPostClick: function (e) {
    wx.navigateTo({
      url: 'post/post',
    })
  },
  onPullDownRefresh: function () {
    console.log("下拉加载。。。");
    var that = this;
    that.data.leancloud_discovery_data = [];
    that.getWxDiscoveryList("onPullDown");
  },
  onReachBottom: function () {
    console.log('上拉...');
  },
  _updateDiscoveryZanShow: function (mode, discovery_id) {
    var that = this;
    for (var i = 0; i < that.data.leancloud_discovery_data.length; i++) {
      if (that.data.leancloud_discovery_data[i].id == discovery_id) {
        if (mode == 'cancel') {
          that.data.leancloud_discovery_data[i].zanNum = that.data.leancloud_discovery_data[i].zanNum - 1;
          that.data.leancloud_discovery_data[i].zanCurrent = false;
        }
        else if (mode == 'submit') {
          that.data.leancloud_discovery_data[i].zanNum = that.data.leancloud_discovery_data[i].zanNum + 1;
          that.data.leancloud_discovery_data[i].zanCurrent = true;
        }
        break;
      }
    }
    that.setData({
      leancloud_discovery_data: that.data.leancloud_discovery_data
    })
  },
  _writeDiscoveryZanInLeanCloud: function (user_id, discovery_id, zan_id) {
    var that = this;
    // 查询当前用户是否已点赞
    var query = new AV.Query('WxDiscoveryZan');
    var search = [that.data.leancloud_user_id];
    query.equalTo('discoveryObjId', discovery_id);
    query.containsAll('userList', search);
    query.find().then(function (results) {
      //console.log(results);
      if (results.length == 1) {
        // 当前用户已给该评论点赞，取消赞
        var op_str = "update WxDiscoveryZan set zan=op('Decrement', {'amount': 1}),userList=op('Remove', {'objects':[\"" + that.data.leancloud_user_id + "\"]}) where objectId='" + zan_id + "'";
        AV.Query.doCloudQuery(op_str).then(function (data) {
          // data 中的 results 是本次查询返回的结果，AV.Object 实例列表
          // 更新显示, -1
          //console.log('update zan cancel');
          that._updateDiscoveryZanShow('cancel', discovery_id);
        }, function (error) {
          // 异常处理
          console.error(error);
        });
      }
      else {
        // 当前用户还未给该评论点赞
        var op_str = "update WxDiscoveryZan set zan=op('Increment', {'amount': 1}),userList=op('AddUnique', {'objects':[\"" + that.data.leancloud_user_id + "\"]}) where objectId='" + zan_id + "'";
        AV.Query.doCloudQuery(op_str).then(function (data) {
          // data 中的 results 是本次查询返回的结果，AV.Object 实例列表
          // 更新显示
          //console.log('update zan submit');
          that._updateDiscoveryZanShow('submit', discovery_id);
        }, function (error) {
          // 异常处理
          console.error(error);
        });
      }
    }).catch(console.error);
  },
  avatarClicked: function () {
    console.log('avatarClicked');
  },
  textContentClick: function () {
    console.log('textContentClick');
  },
  textContentLongPress: function(e) {
    var that = this;

    console.log(e.currentTarget.dataset.discovery_id);
    // 判断是否为root用户，是则可以删除该发现和相关赞及发现评论
    // LeanCloud 组合查询，userId和isRoot and
    const user = AV.User.current();
    var user_query = new AV.Query('Admin');
    user_query.equalTo('adminId', user.id);
    user_query.find().then(function(res){
      // 查询到用户为管理员
      if(res.length == 1) {
        wx.showModal({
          title: '提示',
          content: '管理员，确定删除该发现吗？',
          success: function (res) {
            if (res.confirm) {
              // 删除发现/赞/发现评论
              var todo = new AV.Object.createWithoutData('WxDiscovery', e.currentTarget.dataset.discovery_id);
              todo.destroy().then(function (success) {
                // 删除成功
                // 删除发现对应的点赞对象
                //console.log(e.currentTarget.dataset.zan_id)
                var zantodo = new AV.Object.createWithoutData('WxDiscoveryZan', e.currentTarget.dataset.zan_id);
                zantodo.destroy().then(function (success) {
                  //删除发现对应赞成功，删除发现对应评论
                  console.log('删除发现和赞完成');
                  var comment_query = new AV.Query('WxComment');
                  comment_query.equalTo('article_id', 'discovery_' + e.currentTarget.dataset.discovery_id);
                  comment_query.find().then(function(res){
                    // 批量删除
                    //console.log(res);
                    AV.Object.destroyAll(res).then(function () {
                      // 成功
                      console.log('批量删除发现评论成功');
                      // 同步本地显示
                      var index;
                      //console.log(that.data.leancloud_comment_data.length);
                      for (var i = 0; i < that.data.leancloud_discovery_data.length; i++) {
                        if ((that.data.leancloud_discovery_data[i].id).indexOf(e.currentTarget.dataset.discovery_id) > -1) {
                          index = i;
                          that.data.leancloud_discovery_data.splice(index, 1);
                          break;
                        }
                      }
                      that.setData({
                        leancloud_discovery_data: that.data.leancloud_discovery_data
                      })
                      wx.showToast({
                        title: '删除发现成功！',
                        icon: 'success',
                        duration: 2000
                      })
                    }, function (error) {
                      // 异常处理
                      console.log(error)
                    });
                  }, function (error) {
                    console.log(error)
                  });
                }), function (error) {
                  // 删除发现对应赞失败
                  wx.showToast({
                    title: '删除发现赞失败！',
                    icon: 'none',
                    duration: 2000
                  })
                }
              }, function (error) {
                // 删除失败
                wx.showToast({
                  title: '删除评论失败！',
                  icon: 'none',
                  duration: 2000
                })
              });
            }
            else if (res.cancel) {
              //console.log('用户点击取消')
            }
          }
        })
      }
    }, function (error) {
      console.log(error)
    });
  },
  zandiscoveryClick: function (e) {
    console.log('zandiscoveryClick');
    var that = this;
    // user_id为发现发布者的用户id，非当前用户id
    var user_id = e.currentTarget.dataset.user_id;
    var discovery_id = e.currentTarget.dataset.discovery_id;
    var zan_id = e.currentTarget.dataset.zan_id;
    that._writeDiscoveryZanInLeanCloud(user_id, discovery_id, zan_id);
  },
  commentReplyClicked: function (e) {
    console.log('commentReplyClicked');
    //console.log(e)
    var time = e.currentTarget.dataset.time;
    var discovery_id = e.currentTarget.dataset.discovery_id;
    var nickname = e.currentTarget.dataset.nickname;
    var content = e.currentTarget.dataset.content;
    var avatarUrl = e.currentTarget.dataset.avatarurl;
    var user_id = e.currentTarget.dataset.user_id;
    wx.navigateTo({
      url: './comment/comment?discovery_id=' + discovery_id + '&avatarUrl=' + avatarUrl + '&time=' + time + '&nickname=' + nickname + '&content=' + content + '&user_id=' + user_id,
    })
  },
  followClicked: function (e) {
    console.log('followClicked');
    //console.log(e.currentTarget.dataset.user_id);
    var that = this;
    if (e.detail.userInfo) {
      //console.log(e.detail.userInfo);
      // 查阅是否已经关注该用户
      var query = AV.User.current().followeeQuery();
      //query.include('followee');
      var targetFollower = AV.Object.createWithoutData('_Followee', e.currentTarget.dataset.user_id);
      query.equalTo('followee', targetFollower);
      query.find().then(function (followees) {
        //关注的用户列表 followees
        //console.log(followees);
        if (followees.length == 1) {
          //已经关注了该用户，是否取关
          wx.showModal({
            title: '提示',
            content: '已关注，是否取消关注该用户？',
            success: function (res) {
              if (res.confirm) {
                AV.User.current().unfollow(e.currentTarget.dataset.user_id).then(function () {
                  //取消关注成功
                  wx.showToast({
                    title: '取消关注成功！',
                    icon: 'success',
                    duration: 2000
                  });
                  return;
                }, function (err) {
                  //取消关注失败
                  console.log(err);
                  return;
                });
              }
              else if (res.cancel) {
                // nothing to do
                return;
              }
            }
          });
        } else {
          // 处理关注
          wx.showModal({
            title: '提示',
            content: '关注该用户？',
            success: function (res) {
              if (res.confirm) {
                AV.User.current().follow(e.currentTarget.dataset.user_id).then(function () {
                  //关注成功
                  // https://leancloud.cn/docs/status_system.html#hash918332471
                  // TODO: 取消关注
                  wx.showToast({
                    title: '关注成功！',
                    icon: 'success',
                    duration: 2000
                  })
                }, function (err) {
                  //关注失败
                  //console.log(err.message);
                  //console.log(err.code);
                  wx.showToast({
                    title: err.message,
                    icon: 'none',
                    duration: 4000
                  })
                });
              } else if (res.cancel) {
                //console.log('用户点击取消')
              }
            }
          })
        }
      }, function (err) {
        //查询失败
        console.log('查询失败');
        console.log(err);
      });
    }
  }
})
