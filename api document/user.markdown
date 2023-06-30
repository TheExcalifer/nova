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

| Response Code |
| ------------- |
| 201           |

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

### **Method:** POST /user/edit/cover-image Authorization

### Request Parameters

| Parameter Name | Required | Type                | Conditions                                    |
| -------------- | -------- | ------------------- | --------------------------------------------- |
| cover          | Yes      | multipart/form-data | max size: 200kb Allow formats: png, jpg, jpeg |

### Error In Response

| key         |
| ----------- |
| maxSize     |
| allowFormat |

### Response

| Response Code |
| ------------- |
| 200           |

---

### **Method:** POST /user/edit/profile-image Authorization

### Request Parameters

| Parameter Name | Required | Type                | Conditions                                    |
| -------------- | -------- | ------------------- | --------------------------------------------- |
| profile        | Yes      | multipart/form-data | max size: 200kb Allow formats: png, jpg, jpeg |

### Error In Response

| key         |
| ----------- |
| maxSize     |
| allowFormat |

### Response

| Response Code |
| ------------- |
| 200           |

---

### **Method:** PUT /user/edit/profile-information Authorization

### Request Parameters

| Parameter Name | Required | Type   | Conditions                                                |
| -------------- | -------- | ------ | --------------------------------------------------------- |
| firstName      | Yes      | string | min: 3, max: 64                                           |
| lastName       | Yes      | string | min: 3, max: 64                                           |
| email          | Yes      | string | min: 3, max: 254                                          |
| bio            | Yes      | string | min: 0, max: 256                                          |
| role           | Yes      | string | min: 0, max: 64                                           |
| gender         | Yes      | string | min: 0, max: 16, allow values: Female, Male, Third Gender |
| currency       | Yes      | string | allow values: ($)USD, wETH, BIT Coin                      |
| phoneNumber    | Yes      | string |                                                           |
| location       | Yes      | string | allow values: United State, KATAR, Canada                 |
| address        | Yes      | string | min: 0, max: 128                                          |

### Error In Response

| key              |
| ---------------- |
| validationErrors |
| userExist        |

### Response

| Response Code |
| ------------- |
| 200           |

---

### **Method:** PUT /user/edit/password Authorization

### Request Parameters

| Parameter Name | Required | Type   | Conditions       |
| -------------- | -------- | ------ | ---------------- |
| oldPassword    | Yes      | string | min: 8, max: 128 |
| password       | Yes      | string | min: 8, max: 128 |
| rePassword     | Yes      | string | min: 8, max: 128 |

### Error In Response

| key               |
| ----------------- |
| validationErrors  |
| incorrectPassword |

### Response

| Response Code |
| ------------- |
| 200           |

---
