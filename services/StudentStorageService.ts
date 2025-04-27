import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Student {
    firstName: string;
    lastName: string;
    albumNumber: string;
}

const STUDENT_DATA_KEY = 'student_profile_data';

export class StudentStorageService {

    
    static async saveStudent(student: Student): Promise<void> {
        try {
            const jsonValue = JSON.stringify(student);
            await AsyncStorage.setItem(STUDENT_DATA_KEY, jsonValue);
            console.log('Student data saved successfully');
        } catch (error) {
            console.error('Error saving student data:', error);
            throw error;
        }
    }

    
    static async getStudent(): Promise<Student | null> {
        try {
            const jsonValue = await AsyncStorage.getItem(STUDENT_DATA_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (error) {
            console.error('Error retrieving student data:', error);
            throw error;
        }
    }

    
    static async clearStudent(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STUDENT_DATA_KEY);
            console.log('Student data cleared successfully');
        } catch (error) {
            console.error('Error clearing student data:', error);
            throw error;
        }
    }
}