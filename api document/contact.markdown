### **Method:** POST /contact-us

### Request Parameters

| Parameter Name | Required | Type   | Conditions        |
| -------------- | -------- | ------ | ----------------- |
| name           | Yes      | string | min: 3, max: 128  |
| email          | Yes      | string | min: 3, max: 254  |
| subject        | Yes      | string | min: 10, max: 64  |
| message        | Yes      | string | min: 10, max: 300 |

### Error In Response

| key              |
| ---------------- |
| validationErrors |

### Response

| Response Code |
| ------------- |
| 200           |

---
