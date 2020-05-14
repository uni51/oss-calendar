import axios from "axios"

const AxiosPlugin = {}

AxiosPlugin.install = function (Vue, options) {
  Vue.mixin({
    methods: {
      async serverSideValidate() {
        //this.$validator.errors.clear()
        for (let key in Vue.prototype.serverSideErrors) {
          // APIサーバ側のバリデートエラーをクライアントバリデートにセットする
          this.$validator.errors.add({
            field: key,
            msg: Vue.prototype.serverSideErrors[key]
          })
        }
        Vue.prototype.serverSideErrors = {}
        console.log('serverSideValidated')
      },

      async localValidate() {
        await this.$validator.validate().then(valid => {
          if (!valid) {
            var e = new Error('ローカルバリデーションエラー')
            e.response = {
              data: this.$validator.errors
            }
            throw e
          }
        })
      },

      initialValidate() {
        Vue.prototype.serverSideErrors = {}
        this.$validator.errors.clear()
        this.$validator.reset()
      }
    }
  })

  Vue.prototype.$axios = axios;

  Vue.prototype.$axios.onRequest = (config => {
    console.log('Making request to ' + config.url)
  });

  Vue.prototype.$axios.onResponse = (response => {
    console.log(response.config.data)
  })

  Vue.prototype.$axios.onError = (error => {
    let message = null
    // リクエストしてレスポンスが返ってきたときのエラー処理
    if (error.response) {
      const data = error.response.data
      const status = error.response.status
      if ((status === 422 || status === 429) && error.response.data.errors) {
        // APIサーバ側でのバリデートエラーをセットする。
        Vue.prototype.serverSideErrors = error.response.data.errors
      } else if (
        (status === 422 || status === 429) &&
        error.response.data.errors
      ) {
        // APIサーバ側でのバリデートエラーをセットする。
        Vue.prototype.serverSideErrors = error.response.data.errors
      } else {
        message = data.message
      }
    }
    // リクエストしてレスポンスを受け取ることができなかったときのエラー処理
    else if (error.request) {
      message = 'このリクエストは、サーバ側で処理できませんでした。'
    }
    // リクエストもレスポンスもできなかったときのエラー処理
    else {
      message =
        'リクエストの設定中に何らかの問題が発生し、エラーが発生しました。'
    }

    if (message !== null) {
      this.$store.commit('message/setMessage', message)
    }
  })
}

export default AxiosPlugin;
