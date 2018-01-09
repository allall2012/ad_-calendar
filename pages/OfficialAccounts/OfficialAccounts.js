// pages/OfficialAccounts/OfficialAccounts.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userinfo:'',
    domain:'',
    rd_session:'',
    mps:'',//原始数据
    mpsed:''//已转换过的 数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.showLoading({
      'title': '加载中',
      'mask': true,
      success: function () {
      }
    });
    app.getUserInfo(options);
    var times = setInterval(function () {
      var userinfo = wx.getStorageSync('userinfo');
      var timestamp = Date.parse(new Date()) / 1000;
      if (userinfo.rd_session && timestamp < userinfo.expires_in) {
        clearTimeout(times);
        that.setData({
          domain: app.globalData.domain,
          rd_session: userinfo.rd_session,
          userinfo: userinfo.userinfo
        });
        setTimeout(function () {
          wx.hideLoading();
        }, 1000);
        that.getMps();
        
      }
    }, 100);

  },
  getMps:function(){
    var that = this;
    wx.request({
      url: that.data.domain + '/api/mp',
      data:{
        rd_session: that.data.rd_session
      },
      success:function(res){
        if(res.data.errcode == 0){
          var mps = res.data.data;
            var temp = new Array()
            mps.forEach(function(val){
              // temp[val.id] = new Array();
              // temp[val.id].push(val);
              temp[val.id] = val;
            });
          try {
            wx.setStorageSync('mps', temp);
          } catch (e) {

          }

          var num = 3;
          var mpsed = new Array(Math.ceil(mps.length / num));
          var i=-1;
          mps.forEach(function(val,index){
            if(index % 3 ==0){
              i++;
              mpsed[i] = new Array();
            }
            mpsed[i][index%3]=val;
          });
        
          that.setData({
            mps:res.data.data,
            mpsed:mpsed
          });
        }else{
          wx.showModal({
            title: '提示',
            content: res.data.errmsg,
          })
        }
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
  jumpToOffcialAccounts:function(){
    console.log('ok1');
    wx.switchTab({
      url: '/pages/ReportForms/ReportForms'
    })

  }
})