import { adminDb } from '@/app/utils/firebaseAdmin';

export async function GET(req, { params }) {
    const { id } = params;

    try {
        const doc = await adminDb.firestore().collection('posts').doc(id).get();
        if (!doc.exists) {
            return new Response(JSON.stringify({ error: 'Post not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const post = { id: doc.id, ...doc.data() };
        return new Response(JSON.stringify(post), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function PUT(req, { params }) {
    const { id } = params;
    const { title, content } = await req.json();

    try {
        await adminDb.firestore().collection('posts').doc(id).update({
            title,
            content,
        });

        const updatedPostDoc = await adminDb.firestore().collection('posts').doc(id).get();
        const updatedPost = updatedPostDoc.data();
        return new Response(JSON.stringify({ id, ...updatedPost }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        await adminDb.firestore().collection('posts').doc(id).delete();
        return new Response(JSON.stringify({ id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}


