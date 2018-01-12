//app.js
App({
  onLaunch: function (options) {
    // 展示本地存储能力

    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    var that = this;
    that.openAuth();
  },
  openAuth: function () {
    var that = this;
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {

          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          that.getUser();
        } else {
          wx.authorize({
            scope: 'scope.userInfo',
            success() {
              that.getUser();
            },
            fail() {
              wx.showModal({
                title: '提示',
                content: '未获得您的用户信息，会影响您正常使用该应用，请允许授权',
                success: function (res) {
                  if(res.confirm){
                    wx.openSetting({
                      success: (res) => {
                        // wx.showModal({
                        //   title: 'ceshi',
                        //   content: JSON.stringify(res),
                        // })
                        var setting = res.authSetting;
                        // that.openAuth();
                        if (setting["scope.userInfo"]) {
                          that.openAuth();
                        }

                      }
                    })
                  }
                }
              })
            }
          })
        }
      }
    })
  },
  checkAuth:function(){
    var that = this;
    wx.getSetting({
      success:res=>{
        var setting = res.authSetting;
        if (setting['scope.userInfo'] != true){
          that.openAuth();
        }
      }
    })
  },
  getUser: function () {
    var that = this;
    wx.getUserInfo({
      lang: 'zh_CN',
      success: res => {
        // 可以将 res 发送给后台解码出 unionId
        this.globalData.userInfo = res.userInfo
        console.log(res.userInfo);
        setTimeout(function () { that.updateUser(res.userInfo); }, 2000);
        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        // 所以此处加入 callback 以防止这种情况
        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback(res);

        }
      }
    })

  },
  globalData: {
    userInfo: null,
    domain: 'https://tuitui.wxtt.cn/',
    rd_session: '',
  },
  //更新用户信息
  updateUser: function (data) {
    try {
      var userinfo = wx.getStorageSync('userinfo')
      if (userinfo) {
        data.rd_session = userinfo.rd_session;
        wx.request({
          url: this.globalData.domain + '/api/fans/' + userinfo.userinfo.id,
          method: 'PUT',
          data: data,
          success: function (res) {

          }
        })

        // Do something with return value
      }
    } catch (e) {
      // Do something when catch error
    }
  },
  getUserInfo: function (options) {
    var that = this

    var expires_in = wx.getStorageSync('userinfo').expires_in;
    var timestamp = Date.parse(new Date()) / 1000;
    if (timestamp < expires_in) {


    } else {
      // 调用登录接口  
      var scene = decodeURIComponent(options.scene);
      wx.login({
        success: res => {
          options.code = res.code;
          options.scene = scene;
          wx.request({
            url: that.globalData.domain + '/api/login',
            data: options,
            header: {
              'content-type': 'application/json' // 默认值
            },
            success: function (res) {
              if (res.data.errcode == 0) {
                //保存唯一信息
                that.globalData.rd_session = res.data.data.rd_session;
                that.globalData.userInfo = res.data.data
                try {
                  wx.setStorageSync('userinfo', res.data.data);
                } catch (e) {

                }

              }
            }
          })

        }
      });

    }
  }


})