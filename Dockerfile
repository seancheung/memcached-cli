FROM alpine:3.10

ARG CN_MIRROR=false
RUN if [ "$CN_MIRROR" = true ]; then sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories; fi

WORKDIR /var/app
COPY package*.json index.js ./
RUN apk add --update nodejs npm && npm i

ENTRYPOINT ["node", "index.js"]
CMD ["-h"]