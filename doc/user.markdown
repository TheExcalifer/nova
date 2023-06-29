### **Method:** POST /signup

### Request Parameters

| Parameter Name | Required | Type   | Conditions          |
| -------------- | -------- | ------ | ------------------- |
| firstName      | Yes      | string | min: 3 max: 64      |
| lastName       | Yes      | string | min: 3 max: 64      |
| email          | Yes      | string | min: 3 max: 254     |
| password       | Yes      | string | min: 8 max: 128     |
| rePassword     | Yes      | string | min: 8 max: 128     |
| agree          | Yes      | bool   | value must be true! |

### Error In Response

| key              | Description                     |
| ---------------- | ------------------------------- |
| validationErrors | If input conditions won’t match |
| userExists       | If user exist in database       |

### Response

| Response Code | Value Description |
| ------------- | ----------------- |
| 201           | User Information  |

---

### **Method:** POST /login

### Request Parameters

| Parameter Name | Required | Type   | Conditions      |
| -------------- | -------- | ------ | --------------- |
| email          | Yes      | string | min: 3 max: 254 |
| password       | Yes      | string | min: 8 max: 128 |

### Error In Response

| key              | Description                       |
| ---------------- | --------------------------------- |
| validationErrors | If input conditions won’t match   |
| userOrPassword   | If user or password are incorrect |

### Response

| Response Code | Value Description |
| ------------- | ----------------- |
| 200           | jwt token         |

---
