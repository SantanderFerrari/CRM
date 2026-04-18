const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM API',
      version: '1.0.0',
      description: 'Full CRM system API — tickets, customers, devices, job cards, leave, funds requisitions and more.',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your access token from POST /api/auth/login',
        },
      },
      schemas: {
        // ── Enums ─────────────────────────────────────────────────────
        UserRole: {
          type: 'string',
          enum: ['CUSTOMER_CARE','TECHNICIAN','SUPERVISOR','SALES_REPRESENTATIVE',
                 'HEAD_OF_DEPARTMENT','HUMAN_RESOURCES','ADMIN'],
        },
        TicketStatus: {
          type: 'string',
          enum: ['NEW','ASSIGNED','IN_PROGRESS','CLOSED_CUST_PICKUP','CLOSED','REOPENED','ESCALATED'],
        },
        JobCardStatus: {
          type: 'string',
          enum: ['CREATED','CHECKLIST_PENDING','IN_PROGRESS','COMPLETED','PENDING_APPROVAL','CLOSED'],
        },
        DeviceCondition: {
          type: 'string',
          enum: ['GOOD','FAIR','DAMAGED','CRITICAL'],
        },
        LeaveCategory: {
          type: 'string',
          enum: ['ANNUAL_LEAVE','SICK_LEAVE','MATERNITY_LEAVE','PATERNITY_LEAVE','COMPASSIONATE_LEAVE'],
        },
        LeaveStatus: {
          type: 'string',
          enum: ['PENDING','APPROVED','REJECTED','CANCELLED'],
        },
        FundsStatus: {
          type: 'string',
          enum: ['DRAFT','PENDING_SUPERVISOR','PENDING_FINANCE','APPROVED','REJECTED'],
        },

        // ── Common ────────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field:   { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },

        // ── Users ─────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            user_id:    { type: 'string', format: 'uuid' },
            name:       { type: 'string' },
            email:      { type: 'string', format: 'email' },
            phone:      { type: 'string', nullable: true },
            role:       { $ref: '#/components/schemas/UserRole' },
            is_active:  { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },

        // ── Customers ─────────────────────────────────────────────────
        Customer: {
          type: 'object',
          properties: {
            customer_id: { type: 'string', format: 'uuid' },
            name:        { type: 'string' },
            phone:       { type: 'string', nullable: true },
            email:       { type: 'string', nullable: true },
            address:     { type: 'string', nullable: true },
            kra_pin:     { type: 'string', nullable: true },
            created_at:  { type: 'string', format: 'date-time' },
          },
        },

        // ── Devices ───────────────────────────────────────────────────
        Device: {
          type: 'object',
          properties: {
            device_id:     { type: 'string', format: 'uuid' },
            customer_id:   { type: 'string', format: 'uuid' },
            serial_number: { type: 'string', nullable: true },
            brand:         { type: 'string', nullable: true },
            model:         { type: 'string', nullable: true },
            device_type:   { type: 'string', nullable: true },
            customer_name: { type: 'string' },
            created_at:    { type: 'string', format: 'date-time' },
          },
        },

        // ── Tickets ───────────────────────────────────────────────────
        Ticket: {
          type: 'object',
          properties: {
            ticket_id:        { type: 'string', format: 'uuid' },
            ticket_type:      { type: 'string', nullable: true },
            customer_id:      { type: 'string', format: 'uuid' },
            device_id:        { type: 'string', format: 'uuid', nullable: true },
            assigned_user_id: { type: 'string', format: 'uuid', nullable: true },
            status:           { $ref: '#/components/schemas/TicketStatus' },
            reopen_count:     { type: 'integer' },
            escalation_flag:  { type: 'boolean' },
            duplicate_flag:   { type: 'boolean' },
            notes:            { type: 'string', nullable: true },
            customer_name:    { type: 'string' },
            assigned_to:      { type: 'string', nullable: true },
            created_at:       { type: 'string', format: 'date-time' },
            closed_at:        { type: 'string', format: 'date-time', nullable: true },
          },
        },

        // ── Job Cards ─────────────────────────────────────────────────
        JobCard: {
          type: 'object',
          properties: {
            job_card_id:       { type: 'string', format: 'uuid' },
            ticket_id:         { type: 'string', format: 'uuid' },
            technician_id:     { type: 'string', format: 'uuid' },
            supervisor_id:     { type: 'string', format: 'uuid', nullable: true },
            status:            { $ref: '#/components/schemas/JobCardStatus' },
            diagnosis_notes:   { type: 'string', nullable: true },
            repair_notes:      { type: 'string', nullable: true },
            approval_deferred: { type: 'boolean' },
            technician_name:   { type: 'string' },
            supervisor_name:   { type: 'string', nullable: true },
            created_at:        { type: 'string', format: 'date-time' },
            closed_at:         { type: 'string', format: 'date-time', nullable: true },
          },
        },

        // ── Leave ─────────────────────────────────────────────────────
        LeaveRequest: {
          type: 'object',
          properties: {
            leave_id:         { type: 'string', format: 'uuid' },
            user_id:          { type: 'string', format: 'uuid' },
            category:         { $ref: '#/components/schemas/LeaveCategory' },
            start_date:       { type: 'string', format: 'date' },
            end_date:         { type: 'string', format: 'date' },
            duty_resume_date: { type: 'string', format: 'date' },
            days_requested:   { type: 'number' },
            reason:           { type: 'string', nullable: true },
            status:           { $ref: '#/components/schemas/LeaveStatus' },
            sick_certificate: { type: 'boolean' },
            reviewed_by_name: { type: 'string', nullable: true },
            reviewed_at:      { type: 'string', format: 'date-time', nullable: true },
            employee_name:    { type: 'string' },
            created_at:       { type: 'string', format: 'date-time' },
          },
        },

        // ── Funds ─────────────────────────────────────────────────────
        FundsRequisition: {
          type: 'object',
          properties: {
            requisition_id:     { type: 'string', format: 'uuid' },
            requisition_number: { type: 'string' },
            requested_by:       { type: 'string', format: 'uuid' },
            purpose:            { type: 'string' },
            category:           { type: 'string' },
            justification:      { type: 'string' },
            amount_kes:         { type: 'number' },
            amount_words:       { type: 'string' },
            department:         { type: 'string', nullable: true },
            status:             { $ref: '#/components/schemas/FundsStatus' },
            requested_by_name:  { type: 'string' },
            supervisor_name:    { type: 'string', nullable: true },
            supervisor_signed_at: { type: 'string', format: 'date-time', nullable: true },
            finance_signed_at:  { type: 'string', format: 'date-time', nullable: true },
            created_at:         { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],

    paths: {
      // ================================================================
      // AUTH
      // ================================================================
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name','email','password','role'],
                  properties: {
                    name:     { type: 'string', example: 'John Kamau' },
                    email:    { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', example: 'Secret123', minLength: 8 },
                    role:     { $ref: '#/components/schemas/UserRole' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully' },
            422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT tokens',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email','password'],
                  properties: {
                    email:    { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', example: 'Secret123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken:  { type: 'string' },
                      refreshToken: { type: 'string' },
                      user:         { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'New tokens issued' }, 401: { description: 'Invalid refresh token' } },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Revoke refresh token',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/api/auth/logout-all': {
        post: {
          tags: ['Auth'],
          summary: 'Revoke all sessions for current user',
          responses: { 200: { description: 'All sessions revoked' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user from JWT',
          responses: { 200: { description: 'Current user payload' } },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request OTP for password reset',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                  },
                },
                examples: {
                  byEmail: { value: { email: 'john@example.com' } },
                  byPhone: { value: { phone: '+254712345678' } },
                },
              },
            },
          },
          responses: { 200: { description: 'OTP sent if account exists' } },
        },
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password using OTP',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['otp','newPassword'],
                  properties: {
                    email:       { type: 'string' },
                    phone:       { type: 'string' },
                    otp:         { type: 'string', minLength: 6, maxLength: 6 },
                    newPassword: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Password reset successfully' }, 400: { description: 'Invalid or expired OTP' } },
        },
      },

      // ================================================================
      // USERS
      // ================================================================
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users',
          parameters: [
            { name: 'role',      in: 'query', schema: { $ref: '#/components/schemas/UserRole' } },
            { name: 'is_active', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit',     in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'offset',    in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { 200: { description: 'List of users' } },
        },
      },
      '/api/users/change-password': {
        post: {
          tags: ['Users'],
          summary: 'Change own password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword','newPassword'],
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword:     { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Password changed' }, 401: { description: 'Incorrect current password' } },
        },
      },
      '/api/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'User found' }, 404: { description: 'Not found' } },
        },
        patch: {
          tags: ['Users'],
          summary: 'Update user',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name:  { type: 'string' },
                    email: { type: 'string' },
                    role:  { $ref: '#/components/schemas/UserRole' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'User updated' } },
        },
      },
      '/api/users/{id}/activate': {
        patch: {
          tags: ['Users'],
          summary: 'Activate user (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'User activated' } },
        },
      },
      '/api/users/{id}/deactivate': {
        patch: {
          tags: ['Users'],
          summary: 'Deactivate user (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'User deactivated' } },
        },
      },

      // ================================================================
      // CUSTOMERS
      // ================================================================
      '/api/customers': {
        get: {
          tags: ['Customers'],
          summary: 'List customers',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name, email or phone' },
            { name: 'limit',  in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { 200: { description: 'List of customers' } },
        },
        post: {
          tags: ['Customers'],
          summary: 'Create customer',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name:    { type: 'string', example: 'Jane Mwangi' },
                    phone:   { type: 'string', example: '+254712345678' },
                    email:   { type: 'string', example: 'jane@example.com' },
                    address: { type: 'string', example: 'Westlands, Nairobi' },
                    kra_pin: { type: 'string', example: 'A123456789B' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Customer created' } },
        },
      },
      '/api/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Customer found' }, 404: { description: 'Not found' } },
        },
        patch: {
          tags: ['Customers'],
          summary: 'Update customer',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' }, phone: { type: 'string' },
                    email: { type: 'string' }, address: { type: 'string' }, kra_pin: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Customer updated' } },
        },
        delete: {
          tags: ['Customers'],
          summary: 'Delete customer (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Customer deleted' }, 409: { description: 'Has existing tickets' } },
        },
      },
      '/api/customers/{id}/devices': {
        get: {
          tags: ['Customers'],
          summary: "List customer's devices",
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Device list' } },
        },
      },

      // ================================================================
      // DEVICES
      // ================================================================
      '/api/devices': {
        get: {
          tags: ['Devices'],
          summary: 'List devices',
          parameters: [
            { name: 'customer_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'limit',  in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { 200: { description: 'Device list' } },
        },
        post: {
          tags: ['Devices'],
          summary: 'Register device',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['customer_id'],
                  properties: {
                    customer_id:   { type: 'string', format: 'uuid' },
                    serial_number: { type: 'string', example: 'SN-20240001' },
                    brand:         { type: 'string', example: 'Samsung' },
                    model:         { type: 'string', example: 'Galaxy S23' },
                    device_type:   { type: 'string', example: 'Smartphone' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Device registered' } },
        },
      },
      '/api/devices/{id}': {
        get: {
          tags: ['Devices'],
          summary: 'Get device by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Device found' } },
        },
        patch: {
          tags: ['Devices'],
          summary: 'Update device',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    serial_number: { type: 'string' }, brand: { type: 'string' },
                    model: { type: 'string' }, device_type: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Device updated' } },
        },
      },

      // ================================================================
      // TICKETS
      // ================================================================
      '/api/tickets': {
        get: {
          tags: ['Tickets'],
          summary: 'List tickets',
          parameters: [
            { name: 'status',           in: 'query', schema: { $ref: '#/components/schemas/TicketStatus' } },
            { name: 'assigned_user_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'customer_id',      in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'limit',            in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'offset',           in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { 200: { description: 'Ticket list' } },
        },
        post: {
          tags: ['Tickets'],
          summary: 'Create ticket',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['customer_id'],
                  properties: {
                    customer_id:  { type: 'string', format: 'uuid' },
                    device_id:    { type: 'string', format: 'uuid', nullable: true },
                    ticket_type:  { type: 'string', example: 'REPAIR', enum: ['REPAIR','DIAGNOSTIC','WARRANTY','UPGRADE','OTHER'] },
                    notes:        { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Ticket created. May include warning if duplicate detected.' },
          },
        },
      },
      '/api/tickets/{id}': {
        get: {
          tags: ['Tickets'],
          summary: 'Get ticket with full detail (accessories + condition reports)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Ticket detail' } },
        },
      },
      '/api/tickets/{id}/status': {
        patch: {
          tags: ['Tickets'],
          summary: 'Update ticket status (enforces state machine)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: { status: { $ref: '#/components/schemas/TicketStatus' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Status updated' }, 400: { description: 'Invalid transition' } },
        },
      },
      '/api/tickets/{id}/assign': {
        patch: {
          tags: ['Tickets'],
          summary: 'Assign ticket to technician',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['assigned_user_id'],
                  properties: { assigned_user_id: { type: 'string', format: 'uuid' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Ticket assigned' } },
        },
      },
      '/api/tickets/{id}/accessories': {
        get: {
          tags: ['Tickets'],
          summary: 'List ticket accessories',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Accessory list' } },
        },
        post: {
          tags: ['Tickets'],
          summary: 'Log accessory',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['description'],
                  properties: {
                    description: { type: 'string', example: 'Original charger' },
                    condition:   { $ref: '#/components/schemas/DeviceCondition' },
                    notes:       { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Accessory logged' } },
        },
      },
      '/api/tickets/{id}/condition-report': {
        get: {
          tags: ['Tickets'],
          summary: 'Get condition reports',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Condition reports' } },
        },
        post: {
          tags: ['Tickets'],
          summary: 'Add condition report',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    condition_summary: { $ref: '#/components/schemas/DeviceCondition' },
                    condition_notes:   { type: 'string' },
                    inspection_name:   { type: 'string' },
                    accessory_id:      { type: 'string', format: 'uuid', nullable: true },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Report saved' } },
        },
      },

      // ================================================================
      // JOB CARDS
      // ================================================================
      '/api/job-cards': {
        get: {
          tags: ['Job Cards'],
          summary: 'List job cards',
          parameters: [
            { name: 'ticket_id',     in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'technician_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'status',        in: 'query', schema: { $ref: '#/components/schemas/JobCardStatus' } },
            { name: 'limit',         in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: { 200: { description: 'Job card list' } },
        },
        post: {
          tags: ['Job Cards'],
          summary: 'Create job card (ticket must be IN_PROGRESS)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ticket_id','technician_id'],
                  properties: {
                    ticket_id:       { type: 'string', format: 'uuid' },
                    technician_id:   { type: 'string', format: 'uuid' },
                    supervisor_id:   { type: 'string', format: 'uuid', nullable: true },
                    diagnosis_notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Job card created' }, 400: { description: 'Ticket not IN_PROGRESS' } },
        },
      },
      '/api/job-cards/inventory/list': {
        get: {
          tags: ['Job Cards'],
          summary: 'List inventory parts',
          responses: { 200: { description: 'Inventory list' } },
        },
      },
      '/api/job-cards/{id}': {
        get: {
          tags: ['Job Cards'],
          summary: 'Get job card with all sub-resources',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Full job card detail' } },
        },
      },
      '/api/job-cards/{id}/status': {
        patch: {
          tags: ['Job Cards'],
          summary: 'Update job card status',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status:            { $ref: '#/components/schemas/JobCardStatus' },
                    repair_notes:      { type: 'string' },
                    diagnosis_notes:   { type: 'string' },
                    approval_deferred: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Status updated' }, 400: { description: 'Invalid transition' } },
        },
      },
      '/api/job-cards/{id}/checklist': {
        post: {
          tags: ['Job Cards'],
          summary: 'Add checklist item',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['item_name'], properties: { item_name: { type: 'string' } } } } },
          },
          responses: { 201: { description: 'Checklist item added' } },
        },
      },
      '/api/job-cards/{id}/checklist/{checklistId}': {
        patch: {
          tags: ['Job Cards'],
          summary: 'Toggle checklist item complete/incomplete',
          parameters: [
            { name: 'id',          in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'checklistId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['is_completed'], properties: { is_completed: { type: 'boolean' } } } } },
          },
          responses: { 200: { description: 'Checklist item updated' } },
        },
      },
      '/api/job-cards/{id}/time-logs': {
        post: {
          tags: ['Job Cards'],
          summary: 'Log time spent',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['start_time'],
                  properties: {
                    start_time: { type: 'string', format: 'date-time' },
                    end_time:   { type: 'string', format: 'date-time' },
                    notes:      { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Time logged' } },
        },
      },
      '/api/job-cards/{id}/parts': {
        post: {
          tags: ['Job Cards'],
          summary: 'Log parts used (deducts from inventory)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['inventory_id','quantity_used'],
                  properties: {
                    inventory_id:  { type: 'string', format: 'uuid' },
                    quantity_used: { type: 'integer', minimum: 1 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Parts logged' }, 400: { description: 'Insufficient stock' } },
        },
      },
      '/api/job-cards/{id}/requisitions': {
        post: {
          tags: ['Job Cards'],
          summary: 'Raise stock requisition',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['inventory_id','quantity_requested'],
                  properties: {
                    inventory_id:       { type: 'string', format: 'uuid' },
                    quantity_requested: { type: 'integer', minimum: 1 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Requisition raised' } },
        },
      },
      '/api/job-cards/{id}/requisitions/{requisitionId}/approve': {
        patch: {
          tags: ['Job Cards'],
          summary: 'Approve stock requisition (Supervisor)',
          parameters: [
            { name: 'id',            in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'requisitionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Requisition approved' } },
        },
      },
      '/api/job-cards/{id}/requisitions/{requisitionId}/reject': {
        patch: {
          tags: ['Job Cards'],
          summary: 'Reject stock requisition (Supervisor)',
          parameters: [
            { name: 'id',            in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'requisitionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Requisition rejected' } },
        },
      },
      '/api/job-cards/{id}/incidents': {
        post: {
          tags: ['Job Cards'],
          summary: 'Log incident',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['description'], properties: { description: { type: 'string' } } } } },
          },
          responses: { 201: { description: 'Incident logged' } },
        },
      },

      // ================================================================
      // DASHBOARD
      // ================================================================
      '/api/dashboard/stats': {
        get: {
          tags: ['Dashboard'],
          summary: 'Get KPI stats — ticket counts, technician workload, escalated tickets, daily trend',
          responses: {
            200: {
              description: 'Dashboard stats',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      summary:           { type: 'object' },
                      daily_tickets:     { type: 'array', items: { type: 'object' } },
                      technicians:       { type: 'array', items: { type: 'object' } },
                      escalated_tickets: { type: 'array', items: { type: 'object' } },
                      recent_tickets:    { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ================================================================
      // LEAVE
      // ================================================================
      '/api/leave/entitlements': {
        get: {
          tags: ['Leave'],
          summary: 'Get leave entitlements per category',
          responses: { 200: { description: 'Entitlements' } },
        },
      },
      '/api/leave/balance': {
        get: {
          tags: ['Leave'],
          summary: 'Get own leave balance for current year',
          responses: { 200: { description: 'Leave balance' } },
        },
      },
      '/api/leave/balance/{userId}': {
        get: {
          tags: ['Leave'],
          summary: "Get any user's leave balance (Manager only)",
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Leave balance' } },
        },
      },
      '/api/leave': {
        get: {
          tags: ['Leave'],
          summary: 'List leave requests (own for staff, all for managers)',
          parameters: [
            { name: 'status',   in: 'query', schema: { $ref: '#/components/schemas/LeaveStatus' } },
            { name: 'category', in: 'query', schema: { $ref: '#/components/schemas/LeaveCategory' } },
            { name: 'user_id',  in: 'query', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Leave requests' } },
        },
        post: {
          tags: ['Leave'],
          summary: 'Submit leave request',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['category','start_date','end_date','duty_resume_date','days_requested'],
                  properties: {
                    category:         { $ref: '#/components/schemas/LeaveCategory' },
                    start_date:       { type: 'string', format: 'date', example: '2025-08-01' },
                    end_date:         { type: 'string', format: 'date', example: '2025-08-14' },
                    duty_resume_date: { type: 'string', format: 'date', example: '2025-08-15' },
                    days_requested:   { type: 'number', example: 10 },
                    reason:           { type: 'string' },
                    sick_certificate: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Leave request submitted' } },
        },
      },
      '/api/leave/{id}': {
        get: {
          tags: ['Leave'],
          summary: 'Get leave request by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Leave request' } },
        },
      },
      '/api/leave/{id}/review': {
        patch: {
          tags: ['Leave'],
          summary: 'Approve or reject leave request (Manager only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['action'],
                  properties: {
                    action:       { type: 'string', enum: ['APPROVED','REJECTED'] },
                    review_notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Leave reviewed with timestamp' } },
        },
      },
      '/api/leave/{id}/cancel': {
        patch: {
          tags: ['Leave'],
          summary: 'Cancel own pending leave request',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Leave cancelled' } },
        },
      },

      // ================================================================
      // FUNDS
      // ================================================================
      '/api/funds/categories': {
        get: {
          tags: ['Funds'],
          summary: 'Get available fund categories',
          responses: { 200: { description: 'Category list' } },
        },
      },
      '/api/funds': {
        get: {
          tags: ['Funds'],
          summary: 'List funds requisitions (own for staff, all for approvers)',
          parameters: [
            { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/FundsStatus' } },
          ],
          responses: { 200: { description: 'Requisition list' } },
        },
        post: {
          tags: ['Funds'],
          summary: 'Create funds requisition (saved as DRAFT)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['purpose','category','justification','amount_kes','amount_words'],
                  properties: {
                    purpose:       { type: 'string', example: 'Purchase office supplies' },
                    category:      { type: 'string', example: 'Operational Expense' },
                    justification: { type: 'string' },
                    amount_kes:    { type: 'number', example: 50000 },
                    amount_words:  { type: 'string', example: 'Kenya Shillings Fifty Thousand Only' },
                    department:    { type: 'string', example: 'Operations' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Requisition created as draft' } },
        },
      },
      '/api/funds/{id}': {
        get: {
          tags: ['Funds'],
          summary: 'Get requisition by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Requisition detail with all approval timestamps' } },
        },
      },
      '/api/funds/{id}/submit': {
        patch: {
          tags: ['Funds'],
          summary: 'Submit draft for supervisor approval',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Status changed to PENDING_SUPERVISOR' } },
        },
      },
      '/api/funds/{id}/supervisor-approve': {
        patch: {
          tags: ['Funds'],
          summary: 'Supervisor approves — forwards to finance (Supervisor/Admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Approved with supervisor timestamp, status → PENDING_FINANCE' } },
        },
      },
      '/api/funds/{id}/finance-approve': {
        patch: {
          tags: ['Funds'],
          summary: 'Finance gives final approval (HOD/Admin/HR)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Fully approved with finance timestamp' } },
        },
      },
      '/api/funds/{id}/reject': {
        patch: {
          tags: ['Funds'],
          summary: 'Reject requisition at any stage',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['rejection_reason'],
                  properties: { rejection_reason: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Requisition rejected' } },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);