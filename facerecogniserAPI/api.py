import os
from flask import Flask, render_template, request, send_from_directory
from flask_socketio import SocketIO
import logging
from sys import stdout
import cv2
import numpy as np
import base64


app = Flask(__name__)
app.logger.addHandler(logging.StreamHandler(stdout))
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True
socketio = SocketIO(app,cors_allowed_origins="*")


recognModel = 'nn-models/openface.nn4.small2.v1.t7'
haarcascade = 'nn-models/haarcascade_frontalface_alt2.xml'
netRecogn = cv2.dnn.readNetFromTorch(recognModel)
face_cascade = cv2.CascadeClassifier(haarcascade)

def detectFace(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray)
    if (len(faces) == 0):
        return None,None
    (x, y, w, h) = faces[0]
    return gray[y:y+w, x:x+h], faces[0]

def face2vec(face):
    facebgr = cv2.cvtColor(face, cv2.COLOR_RGB2BGR)
    blob = cv2.dnn.blobFromImage(facebgr, 1.0 /255, (96,96))
    netRecogn.setInput(blob)
    vec = netRecogn.forward()
    return vec

def recognize(face1,face2):
    vec1 = face2vec(face1)
    vec2 = face2vec(face2)
    return vec1.dot(vec2.reshape(128,1))

def readb64(uri):
        nparr = np.fromstring(base64.b64decode(uri), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

Videoface = None
Uploadface = None

@socketio.on('VideoImage')
def handle_message(dataURL):
    global Videoface
    dataURL = dataURL.split(',')[1]
    img = readb64(dataURL)
    print('---Recieving Video Data---')
    gray , rect = detectFace(img)
    if type(rect) != type(None):
        (x, y, w, h) = rect
        Videoface = img[y:y+w, x:x+h]
        print("Video")
        print(type(Videoface))
        cv2.imwrite('videoface.jpeg',img[y:y+w, x:x+h])
        socketio.emit('VideoImageRecieved')
    else:
        Videoface = None
        print('--- No Faces detected in Video---')

@socketio.on('UploadImage')
def handle_message(dataURL):
    global Uploadface
    print('---Recieving Uploaded image---')
    img = readb64(dataURL)
    gray , rect = detectFace(img)
    if type(rect) != type(None):
        (x, y, w, h) = rect
        Uploadface = img[y:y+w, x:x+h]
        print('Upload')
        print(type(Uploadface))
        cv2.imwrite('Uploadface.jpeg',img[y:y+w, x:x+h])
        socketio.emit('UploadImageRecieved')
    else:
        Uploadface = None
        print('--- No Faces detected in photo---')

@socketio.on('VideoandUploadImage')
def handle_message(data):
    img_video = readb64(data['video_image'].split(',')[1])
    img_upload = readb64(data['user_image'])
    gray_video, rect_video = detectFace(img_video)
    gray_upload, rect_upload = detectFace(img_upload)

    if type(rect_video) != type(None) and type(rect_upload) != type(None):
        (x, y, w, h) = rect_video
        Videoface = img_video[y:y+w, x:x+h]
        cv2.imwrite('videoface.jpeg', img_video[y:y+w, x:x+h])
        (x, y, w, h) = rect_upload
        Uploadface = img_upload[y:y+w, x:x+h]
        cv2.imwrite('videoface.jpeg', img_upload[y:y+w, x:x+h])
        output = recognize(Videoface, Uploadface)
        print(type(output[0][0]))
        socketio.emit('output', str(output[0][0]))
    elif type(rect_video) == type(None):
        print('--- No Faces detected in Video---')
    else:
        print('--- No Faces detected in Upload---')


@socketio.on('Recognise')
def handle_message():
    if ( type(Videoface) == type(None) or type(Uploadface) == type(None)):
        socketio.emit('output','Face not recognised Try again!')
    else:
        output = recognize(Videoface,Uploadface)
        socketio.emit('output', str(output[0]))

@socketio.on('connect', namespace='/test')
def test_connect():
    app.logger.info("client connected")

@socketio.on('connect')
def connect():
    app.logger.info('connected')

@socketio.on('test')
def tester(message):
    print(message)

if __name__ == '__main__':
    socketio.run(app)
