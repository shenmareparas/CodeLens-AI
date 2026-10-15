FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/CodeLens.Api/CodeLens.Api.csproj", "src/CodeLens.Api/"]
COPY ["src/CodeLens.Core/CodeLens.Core.csproj", "src/CodeLens.Core/"]
COPY ["src/CodeLens.Infrastructure/CodeLens.Infrastructure.csproj", "src/CodeLens.Infrastructure/"]
RUN dotnet restore "src/CodeLens.Api/CodeLens.Api.csproj"
COPY . .
WORKDIR "/src/src/CodeLens.Api"
RUN dotnet build "CodeLens.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "CodeLens.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CodeLens.Api.dll"]
