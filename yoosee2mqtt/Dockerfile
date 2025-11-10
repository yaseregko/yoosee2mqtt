ARG BUILD_FROM
FROM $BUILD_FROM

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /app

RUN apk add --update --no-cache jq nodejs npm
RUN npm install fs mqtt mailparser smtp-server

COPY yoosee2mqtt.js /app
COPY rootfs /

# Build arguments
ARG BUILD_ARCH
ARG BUILD_DATE
ARG BUILD_REF
ARG BUILD_VERSION

# Labels
LABEL \
    io.hass.name="Doorbell Yoosee SD-05" \
    io.hass.description="This addon simulate an SMTP server (required by Yoosee/KONX doorbell) and public a message in MQTT everytime the doorbell rings." \
    io.hass.arch="${BUILD_ARCH}" \
    io.hass.type="addon" \
    io.hass.version=${BUILD_VERSION} \
    maintainer="Sergey Rubtsov <ya.seregko@gmail.com>" \
    org.opencontainers.image.title="yoosee2mqtt addon for doorbell" \
    org.opencontainers.image.description="This addon simulate an SMTP server (required by Yoosee/KONX doorbell) and public a message in MQTT everytime the doorbell rings." \
    org.opencontainers.image.vendor="Home Assistant Community Add-ons" \
    org.opencontainers.image.authors="Sergey Rubtsov <ya.seregko@gmail.com>" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.url="https://addons.community" \
    org.opencontainers.image.source="https://github.com/yaseregko/yoosee2mqtt_addon" \
    org.opencontainers.image.documentation="https://github.com/yaseregko/yoosee2mqtt_addon/blob/master/README.md" \
    org.opencontainers.image.created=${BUILD_DATE} \
    org.opencontainers.image.revision=${BUILD_REF} \
    org.opencontainers.image.version=${BUILD_VERSION}
