FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 5050
ENV ASPNETCORE_URLS=http://+:5050

FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
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
