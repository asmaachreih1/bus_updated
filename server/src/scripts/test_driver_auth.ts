import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testDriverAuth() {
    const driverData = {
        id: 'driver_test_' + Date.now(),
        name: 'Test Driver',
        role: 'driver',
        email: 'test_driver_' + Date.now() + '@example.com',
        password: 'password123',
        capacity: 8
    };

    console.log('🧪 Testing Driver Signup...');
    try {
        const signupRes = await axios.post(`${BASE_URL}/auth/signup`, driverData);
        console.log('✅ Signup Success:', signupRes.data.success);
        console.log('User ID:', signupRes.data.user.id);
    } catch (error: any) {
        console.error('❌ Signup Failed:', error.response?.data || error.message);
        return;
    }

    console.log('\n🧪 Testing Driver Login...');
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: driverData.email,
            password: driverData.password
        });
        console.log('✅ Login Success:', loginRes.data.success);
        console.log('Token:', loginRes.data.token);
        console.log('User Role:', loginRes.data.user.role);

        if (loginRes.data.user.role === 'driver') {
            console.log('🎉 Driver auth verified!');
        } else {
            console.log('⚠️ Warning: Role mismatch');
        }
    } catch (error: any) {
        console.error('❌ Login Failed:', error.response?.data || error.message);
    }
}

testDriverAuth();
