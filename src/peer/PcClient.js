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
        this.handleICECandidateEvent= this.handleICECandidateEvent.bind(this)
        this.handleRemoteStreamAdded = this.handleRemoteStreamAdded.bind(this)
        this.sendMessage = this.sendMessage.bind(this)
        this.handleNewICECandidateMsg = this.handleNewICECandidateMsg.bind(this)
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
            pc1.onicecandidate = e => {this.handleICECandidateEvent(pc1,e)}
            pc1.ontrack = e => this.handleRemoteStreamAdded(e,'pc1')
            this.setState({pc1 , callerStream : callerStream})
            this.offer()
        })
        this.socket.on('full', ()=>{
            alert('room full')
        })
        this.socket.on('recOffer',(message)=>{
            this.handleOffer(message)
        })
        this.socket.on('recAnswer', messsage=>{//일단 여기까지 왔음
            let {pc1} = this.state
            pc1.setRemoteDescription(new RTCSessionDescription(messsage.sdp)).then(r =>
            console.log(`pc1 remoteDescription setting success`))
            this.setState({pc1})
        })
        this.socket.on('recCandidate', message=>{
           this.handleNewICECandidateMsg(message)
        })
    }
    handleRemoteStreamAdded(event, pc){
        console.log(`remote stream added ${pc}`)
        if (pc==='pc1'){
            console.log(`remote stream added on pc1`)
            this.callerVideo.current.srcObject = event.stream
        }else if (pc==='pc2'){
            console.log(`remote stream added on pc2`)
            this.calleeVideo.current.srcObject = event.stream

        }
    }

    offer(){
        console.log("offer")
        let {pc1} = this.state
        pc1.createOffer().then(offer=>{
            pc1.setLocalDescription(offer)
                .then(()=>{
                    console.log('pc1 set remote description success')
                })})
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
        console.log("receive offer")
        let {pc2} = this.state
        pc2 =  new RTCPeerConnection(this.state.pcConfig)
        pc2.onicecandidate = e => this.handleICECandidateEvent(pc2,e)
        pc2.ontrack = e=> this.handleRemoteStreamAdded(e,'pc2')
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
                    pc2.setLocalDescription(answer).then(r => console.log('pc2 set remote description success'))})
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
    handleICECandidateEvent(pc,e){
        let {pc1, pc2} = this.state
        if (e.candidate && pc===pc1){
            this.sendMessage({
                type : "candidate",
                target : "callee",
                candidate : e.candidate
            })
        }else if (e.candidate && pc===pc2){
            this.sendMessage({
                type : "candidate",
                target : "caller",
                candidate : e.candidate
            })
        }
        }

    handleNewICECandidateMsg(message){
        console.log(`addicecandidate ${message.target}`)
        const {pc1, pc2} = this.state
        if (message.target==="callee"){
            pc2.addIceCandidate(new RTCIceCandidate(message.candidate)).then(r=>
                console.log('success icecandidate added'))
                .catch(e=>console.log(e))
        }else if (message.target==="caller")
        pc1.addIceCandidate(new RTCIceCandidate(message.candidate)).then(r =>
        console.log('success icecandidate added'))
            .catch(e=>console.log(e))
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