import React, {Component, createRef} from 'react';

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
    }
    componentDidMount() {
        let {pc1} = this.state
        pc1 = new RTCPeerConnection(this.state.pcConfig)
        navigator.mediaDevices.getUserMedia({
            video : true
        })
            .then(stream=>{
                this.callerVideo.current.srcObject= stream
                pc1.onicecandidate = e => {
                    this.handleICECandidateEvent(e)
                }
                stream.getTracks().forEach(track=>pc1.addTrack(track, stream))
                this.setState({pc1 , callerStream : stream})
            })

    }
    offer(){
        let {pc1} = this.state
        pc1.createOffer().then(offer=>{
            pc1.setLocalDescription(offer)
                .then(()=>{
                    //서버로 offer 보내기
                })
                .catch(()=>{
                    console.log("error")
                })
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
                    pc2.setLocalDescription(answer)
                    this.setState({pc2})
                })
            })
            .then(()=>{
                //서버로 보내기
            })
    }
    handleICECandidateEvent(e){
        if (e.candidate){
            //icecandidate를 서버로 보낸다.
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