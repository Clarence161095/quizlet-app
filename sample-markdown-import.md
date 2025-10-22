### Which of the following are good use cases for how Amazon ElastiCache can help an application?

- [ ] Improve the performance of S3 PUT operations.
- [ ] Improve the latency of deployments performed by AWS CodeDeploy.
- [x] Improve latency and throughput for read-heavy application workloads.
- [ ] Reduce the time required to merge AWS CodeCommit branches.
- [x] Improve performance of compute-intensive applications.

ElastiCache is an in-memory caching service that improves performance for read-heavy and compute-intensive workloads.

### Which of the following services are key/value stores?

- [x] Amazon ElastiCache.
- [ ] Simple Notification Service.
- [x] DynamoDB.
- [ ] Simple Workflow Service.
- [x] Simple Storage Service.

Key-value stores allow fast lookups using unique keys. ElastiCache (Redis/Memcached), DynamoDB, and S3 all support key-value operations.

### A developer wants to send multi-value headers to an AWS Lambda function that is registered as a target with an Application Load Balancer (ALB). What should the developer do to achieve this?

- [ ] Place the Lambda function and target group in the same account.
- [ ] Send the request body to the Lambda function with a size less than 1 MB.
- [ ] Include the Base64 encoding status code, status description, and headers in the Lambda function.
- [x] Enable the multi-value headers on the ALB.

### A company's ecommerce website is experiencing massive traffic spikes. A developer wants to implement a caching layer using Amazon ElastiCache. Which cache writing policy will satisfy these requirements?

- [ ] Write to the cache directly and sync the backend at a later time.
- [ ] Write to the backend first and wait for the cache to expire.
- [ ] Write to the cache and the backend at the same time.
- [x] Write to the backend first and invalidate the cache.

### A Developer wants to upload data to Amazon S3 and must encrypt the data in transit. Which solutions will accomplish this task?

- [ ] Set up hardware VPN tunnels to a VPC and access S3 through a VPC endpoint.
- [x] Set up Client-Side Encryption with an AWS KMS-Managed Customer Master Key.
- [ ] Set up Server-Side Encryption with AWS KMS-Managed Keys.
- [x] Transfer the data over an SSL connection.
- [ ] Set up Server-Side Encryption with S3-Managed Keys.

### A Developer wants to encrypt new objects being uploaded to an Amazon S3 bucket by an application. There must be an audit trail of who has used the key. Which type of encryption meets these requirements?

- [ ] Server-side encryption using S3-managed keys.
- [x] Server-side encryption with AWS KMS-managed keys.
- [ ] Client-side encryption with a client-side symmetric master key.
- [ ] Client-side encryption with AWS KMS-managed keys.

### An application is being developed to audit several AWS accounts. What is the MOST secure way to allow the application to call AWS services in each audited account?

- [x] Configure cross-account roles in each audited account. Write code in Account A that assumes those roles.
- [ ] Use S3 cross-region replication to communicate among accounts.
- [ ] Deploy an application in each audited account with its own role.
- [ ] Create an IAM user with an access key in each audited account.

### A company uses a third-party tool to build, bundle, and package its applications on-premises. How can an application be deployed from the source control system onto EC2 instances?

- [ ] Use AWS CodeDeploy and point it to the local storage to directly deploy a bundle.
- [x] Upload the bundle to an Amazon S3 bucket and specify the S3 location when doing a deployment using AWS CodeDeploy.
- [ ] Create a repository using AWS CodeCommit to automatically trigger a deployment.
- [ ] Use AWS CodeBuild to automatically deploy the latest build.

### A company is building a compute-intensive application that will run on Amazon EC2 instances. What should a developer do to ensure the data is encrypted on disk?

- [x] Configure the Amazon EC2 instance fleet to use encrypted EBS volumes for storing data.
- [ ] Add logic to write all data to an encrypted Amazon S3 bucket.
- [ ] Add a custom encryption algorithm to the application.
- [ ] Create a new Amazon Machine Image (AMI) with an encrypted root volume.

### A global company has an application running on Amazon EC2 instances that serves image files from Amazon S3. Which optimization solution should be implemented?

- [ ] Create multiple prefix in the S3 bucket to increase the request rate.
- [ ] Create an Amazon ElastiCache cluster to cache and serve frequently accessed items.
- [x] Use Amazon CloudFront to serve the content of images stored in Amazon S3.
- [ ] Submit a ticket to AWS support to request a rate limit increase for the S3 bucket.
