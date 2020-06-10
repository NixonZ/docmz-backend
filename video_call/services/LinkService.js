const v4 = require("uuid");
const kurento = require("kurento-client");

class LinkService {
  constructor(typeLink, room, provider, consumer) {
    this.room = room;
    this.provider = provider;
    this.consumer = consumer;
    this.typeLink = typeLink;
    const linkId = v4();

    this.roomMediaPipe = room.roomMediaPipe;
    this.userSocket =
      typeLink == "in" ? provider.userSocket : consumer.userSocket;

    const userPart =
      typeLink == "in"
        ? provider.userEmail
        : `${provider.userEmail}->${consumer.userEmail}`;

    this.linkId = `${typeLink}-${userPart}-${linkId}`;
  }

  async create() {
    this.endPoint = await this.roomMediaPipe.create("WebRtcEndpoint");

    this.endPoint.on(`OnIceCandidate`, event => {
      var candidate = kurento.getComplexType("IceCandidate")(event.candidate);
      console.log(`Ice Send-${this.linkId}`);
      this.userSocket.emit(`OnIceCandidate-${this.linkId}`, candidate);
    });

    this.userSocket.on(`OnIceCandidate-${this.linkId}`, async data => {
      console.log(`Ice Recieved-${this.linkId}`);
      var candidate = kurento.getComplexType("IceCandidate")(data);

      this.endPoint.addIceCandidate(data);
    });
    const isAnswered = new Promise((resolve, reject) => {
      console.log("offer linked", this.linkId);
      this.userSocket.on(`offer-${this.linkId}`, async offer => {
        console.log(`Offer Recieved-${this.linkId}`);
        const answer = await this.endPoint.processOffer(offer);

        if (this.typeLink == "view") {
          await this.inLink.endPoint.connect(this.endPoint);
          console.log(`Connected ${this.inLink.Id}->${this.linkId}`);
        }

        this.userSocket.emit(`answer-${this.linkId}`, answer);
        this.endPoint.on("IceCandidateFound", async candidate => {
          //console.log(candidate);
        });

        console.log(`Answer Send-${this.linkId}`);

        await this.endPoint.gatherCandidates(err =>
          console.log("gatherCandidates", err)
        );

        this.endPoint.on("IceComponentStateChange", async data => {
          console.log(this.linkId, data);
          console.log(
            this.linkId,
            "Media State",
            await this.endPoint.getMediaState()
          );
        });
        console.log(this.linkId, await this.endPoint.getConnectionState());
        resolve(true);
      });
    });
    console.log("All events linked");

    this.userSocket.emit("link-add", {
      id: this.linkId,
      type: this.typeLink
    });

    await isAnswered;
  }

  connectIn(link) {
    this.inLink = link;
  }

  async destroy() {
    this.userSocket.emit("link-remove", {
      id: this.linkId,
      type: this.typeLink
    });
  }

  async gatherAll() {}
}

module.exports = LinkService;
