@description('The primary location for all CodeLens AI resources.')
param location string = resourceGroup().location

@description('Suffix for unique resource naming.')
param appSuffix string = uniqueString(resourceGroup().id)

@description('Container image tag for backend API.')
param backendImageTag string = 'latest'

@description('Google Gemini API Key for Semantic Kernel synthesis.')
@secure()
param geminiApiKey string = ''

@description('GitHub Personal Access Token for high-quota ingestion (5,000 req/hr).')
@secure()
param gitHubToken string = ''

@description('JWT Secret Key for backend authentication (minimum 32 characters).')
@secure()
param jwtSecret string = ''

@description('Google Client ID for OAuth token verification.')
param googleClientId string = ''

// ── Resource Names ─────────────────────────────────────────────────────────────
var cosmosAccountName = 'cosmos-codelens-${appSuffix}'
var blobAccountName = 'stcodelens${appSuffix}'
var logAnalyticsName = 'log-codelens-${appSuffix}'
var appEnvName = 'cae-codelens-${appSuffix}'
var backendAppName = 'ca-codelens-api-${appSuffix}'
var staticWebAppName = 'swa-codelens-${appSuffix}'

// ── 1. Azure Cosmos DB (Lifetime Free Tier Enabled) ───────────────────────────
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableFreeTier: true // Enables Lifetime Free Tier (1,000 RU/s + 25 GB storage)
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: 'CodeLensDB'
  properties: {
    resource: {
      id: 'CodeLensDB'
    }
  }
}

// Containers: users (/id), audits (/repositoryId), messages (/auditId)
resource usersContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/sqlContainers@2024-05-15' = {
  parent: cosmosDb
  name: 'Users'
  properties: {
    resource: {
      id: 'Users'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
    }
  }
}

resource auditsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/sqlContainers@2024-05-15' = {
  parent: cosmosDb
  name: 'Audits'
  properties: {
    resource: {
      id: 'Audits'
      partitionKey: {
        paths: ['/repositoryId']
        kind: 'Hash'
      }
    }
  }
}

resource chatContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/sqlContainers@2024-05-15' = {
  parent: cosmosDb
  name: 'ChatSessions'
  properties: {
    resource: {
      id: 'ChatSessions'
      partitionKey: {
        paths: ['/auditId']
        kind: 'Hash'
      }
    }
  }
}

// ── 2. Azure Blob Storage (Hot LRS for PROJECT_KNOWLEDGE.md dossiers) ─────────
resource blobAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: blobAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: blobAccount
  name: 'default'
}

resource dossiersContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobServices
  name: 'project-dossiers'
  properties: {
    publicAccess: 'None'
  }
}

// ── 3. Log Analytics Workspace & Container Apps Environment ───────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource appEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: appEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ── 4. Azure Container Apps (Backend API with scale-to-zero) ──────────────────
var cosmosConnectionString = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
var blobConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${blobAccount.name};AccountKey=${blobAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'

resource backendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: backendAppName
  location: location
  properties: {
    managedEnvironmentId: appEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 5050
        transport: 'auto'
        allowInsecure: false
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: false
        }
      }
      secrets: [
        { name: 'cosmos-connection-string', value: cosmosConnectionString }
        { name: 'blob-connection-string', value: blobConnectionString }
        { name: 'jwt-secret', value: !empty(jwtSecret) ? jwtSecret : 'codelens-super-secret-key-for-development-purposes-must-be-32-chars-minimum' }
        { name: 'gemini-api-key', value: geminiApiKey }
        { name: 'github-token', value: gitHubToken }
      ]
    }
    template: {
      containers: [
        {
          name: 'codelens-api'
          image: 'ghcr.io/shenmareparas/codelens-api:${backendImageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
            { name: 'ASPNETCORE_URLS', value: 'http://+:5050' }
            { name: 'CosmosDb__ConnectionString', secretRef: 'cosmos-connection-string' }
            { name: 'CosmosDb__DatabaseName', value: 'CodeLensDB' }
            { name: 'BlobStorage__ConnectionString', secretRef: 'blob-connection-string' }
            { name: 'BlobStorage__ContainerName', value: 'project-dossiers' }
            { name: 'Jwt__Secret', secretRef: 'jwt-secret' }
            { name: 'Jwt__Issuer', value: 'CodeLensApi' }
            { name: 'Jwt__Audience', value: 'CodeLensClient' }
            { name: 'Google__ClientId', value: googleClientId }
            { name: 'GitHub__Token', secretRef: 'github-token' }
            { name: 'Gemini__ApiKey', secretRef: 'gemini-api-key' }
            { name: 'Gemini__ModelId', value: 'gemini-3.8-flash' }
          ]
        }
      ]
      scale: {
        minReplicas: 0 // Scale-to-zero when idle for 100% $0.00 cost
        maxReplicas: 2
        rules: [
          {
            name: 'http-requests'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// ── 5. Azure Static Web Apps (Frontend Next.js 16 Free Hosting) ───────────────
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: 'eastus2' // Static Web Apps global location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    provider: 'GitHub'
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────
output backendFqdn string = backendApp.properties.configuration.ingress.fqdn
output backendUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output staticWebAppDefaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output cosmosAccountName string = cosmosAccount.name
output blobAccountName string = blobAccount.name
