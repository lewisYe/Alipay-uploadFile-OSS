# 支付宝小程序直传图片至阿里云OSS

本文为支付宝小程序直传OSS实现过程的总结(踩过的坑)。

官方文档[支付宝小程序直传实践中](https://help.aliyun.com/document_detail/173882.html?spm=a2c4g.11186623.6.1563.622f677aDo66jq)

## 获取到AccessKeyId、AccessKeyId、Host

这些基本信息都是在你的阿里云账号中可以获取到的, 也可以问你的后端要。

```javascript
const OSSConfig = {
    "AccessKeyId": "xxxxxxx",
    "AccessKeySecret": "xxxxxx",
    "Host": "https://xxx.oss-cn-hangzhou.aliyuncs.com" // 具体某个账号下,
    "SecurityToken": "xx" // 使用STS签名时必传。
}
```

## 获取签名

使用的方法是官方文档中的步骤2中的客户端获取STS临时账号并生成签名。

```javascript
import crypto from 'crypto-js';
import { Base64 } from 'js-base64';

// 计算签名。
function computeSignature(accessKeySecret, canonicalString) {
    return crypto.enc.Base64.stringify(crypto.HmacSHA1(canonicalString, accessKeySecret));
}

function getFormDataParams() {
    const date = new Date();
    date.setHours(date.getHours() + 1); //加 1个小时
    const policyText = {
        expiration: date.toISOString(), // 设置policy过期时间。
        conditions: [
            // 限制上传大小。
            ["content-length-range", 0, 1024 * 1024 * 1024],
        ],
    };
    const policy = Base64.encode(JSON.stringify(policyText)) // policy必须为base64的string。
    const signature = computeSignature(OSSConfig.AccessKeySecret, policy)
    const formData = {
        OSSAccessKeyId: OSSConfig.AccessKeyId,
        signature,
        policy,
        'x-oss-security-token': OSSConfig.SecurityToken
    }
    return formData
}
```

本地安装2个依赖 
```
npm install --save crypto-js js-base64
```

##  使用my.uploadFile上传

```javascript
  my.uploadFile({
      url: OSSConfig.Host,
      fileType: 'image',
      fileName: 'file',
      filePath: path, // 是my.chooseImage得到的文件
      formData: {
          ...formData, // 为上诉getFormDataParams方法得到的结果
          key: name, // 该值为你存在在oss上的位置  后面上传成功之后拼接得到链接需要使用
          success_action_status: '200', // 默认上传成功状态码为204，此处被success_action_status设置为200。
      },
      success: (res) => {
          if (res.statusCode === 200) {
              console.log('上传成功');
              const url = `${OSSConfig.Host}/${name}` // 拼接上传成功得到的路径
          }
      },
      fail: (res) => {
          my.alert({
              title: '上传失败'
          });
      },
  });
```

### 遇到的问题

**1.js-base64打包无法上传成功**

在小程序IDE里面上诉代码是可以跑起来的。但是上传的时候问题来了。

上传打包的时候报错。错误如下图：
![](https://user-images.githubusercontent.com/29204799/91516410-fdd2de80-e91d-11ea-97b7-95c8a54d67ef.png)

按照文中的提示在根目录下新建`mini.project.json`文件,添加白名单
```javascript
{
  "node_modules_es6_whitelist":[
    "js-base64"
  ]
}
```
该方法我试了无效，任然无法上传。如果有知道问题所在的同学帮指出问题。

解决方法：

在本地实现base64的编码功能，你可以网上直接搜索。或者直接使用仓库中的`base64.js`文件


**上传时报403**

可以具体network中返回的信息对照[官网403错误码表](https://helpcdn.aliyun.com/knowledge_detail/31945.html)排查

## 注意事项

* 小程序后台需要配置安全域名
* OSS后台要配置跨域


