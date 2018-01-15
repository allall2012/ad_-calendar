// pages/Article/Article.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userinfo: '',
    domain: '',
    rd_session: '',
    article_id:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {



    var article_id = options.article_id || '';
    if (article_id == ''){
      wx.showModal({
        title: '提示',
        content: '图文地址不存在',
      });
      wx.navigateBack({
        delta: 1
      });
      return;
    }


    var that = this;
    wx.showLoading({
      'title': '加载中',
      'mask': true,
      success: function () {
      }
    });
    //登录 获取用户openid
    app.getUserInfo(options);

    app.checkAuth()
    var times = setInterval(function () {
      var userinfo = wx.getStorageSync('userinfo');
      var timestamp = Date.parse(new Date()) / 1000;
      if (userinfo.rd_session && timestamp < userinfo.expires_in) {
        clearTimeout(times);
        //获取用户详细信息
        app.getFansInfo(userinfo.rd_session);

        that.setData({
          domain: app.globalData.domain,
          rd_session: userinfo.rd_session,
          userinfo: userinfo.userinfo
        });
        setTimeout(function () {
          wx.hideLoading();
        }, 1000);
        var src = app.globalData.domain + '/api/article/' + article_id + '?rd_session=' + userinfo.rd_session;
        that.setData({
          article_id: article_id,
          src:src
        });
       
        console.log(article_id);

      }
    }, 100);
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
  
  }
})