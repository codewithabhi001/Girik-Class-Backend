/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication API
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User Login
 *     description: Authenticate user and return JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@girik.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job Management API
 */

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: List all jobs
 *     description: Retrieve a list of jobs with pagination and filtering. Roles: ADMIN, GM, TM
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     x-roles: [ADMIN, GM, TM]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a new job
 *     description: Create a new survey job for a vessel.
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     x-roles: [ADMIN, GM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vesselId
 *               - type
 *             properties:
 *               vesselId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [SURVEY, AUDIT, INSPECTION]
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation Error
 */
