import crypto from 'crypto-js';
import Base64 from './base64';

// 基本配置信息
const OSSConfig = {
  "AccessKeyId": "xxxxxxx",
  "AccessKeySecret": "xxxxxx",
  "Host": "https://xxx.oss-cn-hangzhou.aliyuncs.com", // 具体某个账号下,
  "SecurityToken": "xxx" // 使用STS签名时必传。
}

// 计算签名。
function computeSignature(accessKeySecret, canonicalString) {
  return crypto.enc.Base64.stringify(crypto.HmacSHA1(canonicalString, accessKeySecret));
}
function getFormDataParams() {
  const date = new Date();
  date.setHours(date.getHours() + 87677);
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
    // 'x-oss-security-token': OSS.SecurityToken
  }
  return formData
}


export function uploadImage(data = { count: 5 }, callback) {
  my.chooseImage({
    ...data,
    success: (data) => {
      data.apFilePaths.forEach((v,i)=>{
        const formData = getFormDataParams()
        const time = new Date().getTime()
        const name = `${time}${i}.png`;
        my.uploadFile({
          url: OSSConfig.Host,
          fileType: 'image',
          fileName: 'file',
          filePath: v,
          formData: {
            ...formData, // 为上诉getFormDataParams方法得到的结果
            key: name, // 该值为你存在在oss上的位置  后面上传成功之后拼接得到链接需要使用
            success_action_status: '200', // 默认上传成功状态码为204，此处被success_action_status设置为200
          },
          success: (res) => {
            if (res.statusCode === 200) {
              console.log('上传成功');
              const url = `${OSSConfig.Host}/${name}` // 拼接上传成功得到的路径
              callback && callback(url)
            }
          },
          fail: (res) => {
            my.alert({ title: '上传失败' });
          },
        });
      })
    },
  });
}