import React, {Component, createRef} from 'react';
import io from 'socket.io-client'
class PcClient extends Component {
    constructor(props) {
        super(props);
        this.state = {
            callerStream : null,
            calleeStream : null,
            pc1 : null,
            pc2 : null,
            pcConfig : {'iceServers' : [{urls: 'stun:stun.l.google.com:19302'},
                    {urls:  'turn:numb.viagenie.ca', credential : "muazkh", username : "webrtc@live.com"}]},
        }
        this.callerVideo = createRef()
        this.calleeVideo = createRef()
        this.offer = this.offer.bind(this)
        this.handleOffer = this.handleOffer.bind(this)
        this.handleICECandidateEvent = this.handleICECandidateEvent.bind(this)
        this.handleNewICECandidateMsg = this.handleNewICECandidateMsg.bind(this)
        this.handleRemoteStreamAdded = this.handleRemoteStreamAdded.bind(this)
        this.sendMessage = this.sendMessage.bind(this)
        this.socket = io('https://secret-dawn-11778.herokuapp.com/')
    }
    sendMessage(message){
        console.log(`send Message type ${message.type}`)
        this.socket.emit('message', message)
    }
    componentDidMount() {
        this.socket.emit('joinRoom', "room")
        let {pc1} = this.state
        navigator.mediaDevices.getUserMedia({
            video : true
        })
            .then(stream=>{
                this.callerVideo.current.srcObject= stream
                this.setState({callerStream : stream})
            })

        this.socket.on('letOffer',()=>{
            console.log('receive start offer message from server')
            pc1 = new RTCPeerConnection(this.state.pcConfig)
            const {callerStream} = this.state
                callerStream
                .getTracks()
                .forEach(track => pc1.addTrack(track, callerStream))
            pc1.onicecandidate = e => {this.handleICECandidateEvent(e)}
            pc1.ontrack = e => this.handleRemoteStreamAdded(e)
            this.setState({pc1 , callerStream : callerStream})
            this.offer()
        })
        this.socket.on('full', ()=>{
            alert('room full')
        })
        this.socket.on('recOffer',(message)=>{
            this.handleOffer(message)
        })
        this.socket.on('recAnswer', messsage=>{
            this.state.pc2.setRemoteDescription(new RTCSessionDescription(messsage))
        })
    }
    handleRemoteStreamAdded(event){
        this.setState({calleeStream : event.stream})
        this.calleeVideo.current.srcObject = this.state.calleeStream
    }
    offer(){
        console.log("offer")
        let {pc1} = this.state
        pc1.createOffer().then(offer=>{
            pc1.setLocalDescription(offer)})
                .then(()=>{//send offer message
                    this.sendMessage({
                        name : "T01123",
                        target : "S01123",
                        type : "offer",
                        sdp : pc1.localDescription
                    })
                })
                .catch(()=>{
                    console.log("error")
                })
    }
    handleOffer(message){
        let {pc2} = this.state
        pc2 =  new RTCPeerConnection(this.state.pcConfig)
        const desc = new RTCSessionDescription(message.sdp)
        pc2.setRemoteDescription(desc)
            .then(()=>{
                navigator.mediaDevices.getUserMedia({video : true})
                .then(stream=>{
                    stream.getTracks().forEach(track=> pc2.addTrack(track, stream))
                    this.setState({calleeStream : stream})
                })//여기부터 answer
        })
            .then(()=>{
                pc2.createAnswer().then(answer=>{
                    pc2.setLocalDescription(answer)})
                        .then(()=>{//send answer message
                            this.sendMessage({
                                name : "S01123",
                                target : "T01123",
                                type : "answer",
                                sdp : pc2.localDescription
                            })
                            })
                    this.setState({pc2})
            })
    }
    handleICECandidateEvent(e){
        if (e.candidate){
            this.sendMessage({
                type : "candidate",
                target : null,
                candidate : e.candidate
            })
        }
    }
    handleNewICECandidateMsg(message){ //callee 쪽 문단
        const candidate = new RTCIceCandidate(message.candidate)
        let {pc2} = this.state
        pc2.addIceCandidate(candidate)
    }
    render() {
        return (
            <>
                <video ref={this.callerVideo} autoPlay></video>
                <video ref={this.calleeVideo} autoPlay></video>
            </>
        );
    }
}

export default PcClient;